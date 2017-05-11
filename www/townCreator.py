from flask import Flask, render_template
import requests
import random 

from datetime import datetime
import argparse
import json


#load in the  rolling tables
with open('static/json/tables.json') as table_file:
     tables = json.load(table_file)

#load in the housing tables
with open('static/json/house_tables.json') as table_file:
     house_tables = json.load(table_file)


#function to generate number of dice dump the JSON objects to flask
def die_properties():

    dice_properties= []
    numberOfD6 = random.randint(1,10) + 10
    dice_properties.append({
		'type': 'd4',
                'labelColor': '#aaaaaa',
                'dieColor': '#ad0000'
    })
    for dice in range(0,random.randint(1,2)):
        dice_properties.append({
                'type': 'd12',
                'labelColor': '#aaaaaa',
                'dieColor': '#8300ff'
        })
    for dice in range(0,numberOfD6):
	dice_properties.append({
		'type': 'd6',
		'labelColor': '#aaaaaa',
		'dieColor': '#202020'
	})


    die_properties = {
	'set': dice_properties,
	'constant': 0,
	'houses':house_properties(numberOfD6),
	'town_name': get_townname()
	}
    #die_properties = house_properties(numberOfD6)
    return die_properties

def get_townname():
    finished_name = ""
    pd = 0
    if(random.random()  > 0.4):
        finished_name = finished_name + random.choice(tables['town_name']['doubles'])
        if(random.random()  > 0.6):
            finished_name = finished_name + random.choice(tables['town_name']['postdoubles'])
            pd = 1
        else:
            finished_name = finished_name[0:len(finished_name) - 1]
    else:
        finished_name = finished_name + random.choice(tables['town_name']['first'])

    if(random.random()  > 0.5 and not pd):
        if(finished_name.endswith("r") or finished_name.endswith("b")):
            if(random.random()  > 0.4):
                finished_name = finished_name + "ble"
            else:
                finished_name = finished_name + "gle"
        elif(finished_name.endswith("n") or finished_name.endswith("d")):
            finished_name = finished_name + "dle"
        elif(finished_name.endswith("s")):
            finished_name = finished_name + "tle"

    if(random.random()  > 0.7 and finished_name.endswith("le")):
        finished_name = finished_name + "s"

    elif(random.random()  > 0.5):
        if(finished_name.endswith("n")):
            if(random.random()  > 0.5):
                finished_name = finished_name + "s"
            else:
                finished_name = finished_name + "d"
        elif(finished_name.endswith("m")):
            finished_name = finished_name + "s"

    if(random.random()  > 0.7):
        finished_name = finished_name + random.choice(tables['town_name']['mid'])
    finished_name = finished_name + random.choice(tables['town_name']['last'])

    fix = finished_name.rpartition(' ')
    if(fix[1] == ' '):
        finished_name = fix[0] + ' ' + fix[2].capitalize()

    fix = finished_name.rpartition('-')
    if(fix[1] == '-'):
        finished_name = fix[0] + '-' + fix[2].capitalize()

    return finished_name

def get_resident(resident = ""):
	residence_properties = random.choice(house_tables['residence'])
	add_roll = 0

	#Check to see if the json object as an additional property
        if residence_properties.get('add_prop'):
		#does that additional property have a table? if so, roll on it. If it's an adventurer do a recursive check
		if residence_properties['add_prop'].get('add_table'):
			resident += residence_properties['inhabitant'].format(random.choice(residence_properties['add_prop']['add_table']))
			if residence_properties['add_prop'].get('add_type') == 'adventurer'  : resident += " " + get_resident()
		if residence_properties['add_prop'].get('add_roll'):
			number_of_dice,dieType = residence_properties['add_prop']['add_roll'].split('d')
			for dice in range(0,int(number_of_dice)): add_roll += random.randint(1, int(dieType))
			add_roll += int(residence_properties['add_prop']['add_mod'])
			if add_roll <= 0 :  add_roll = "no"
			resident += residence_properties['inhabitant'].format(add_roll)
	else:
		resident += residence_properties['inhabitant']
	return resident

#function to generate houses and people that live in them
def house_properties(numberOfHouses):
    house_properties = []



    for house in range(0,numberOfHouses):
	house_relationship = list( range(0, numberOfHouses) )
	house_relationship.remove(house);
	house_properties.append({
                'id': house,
                'inhabitant': get_resident(),
                'relationship': random.choice(house_tables['relationship']),
		'to':random.choice( house_relationship)
	})
    return house_properties

#get arguments for the analytics python script
def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '-H',
        '--host',
        help='Set web server listening host',
        default='10.142.0.5'
    )
    parser.add_argument(
        '-P',
        '--port',
        type=int,
        help='Set web server listening port',
        default=8000
    )
    parser.add_argument(
        '-d', '--debug', help='Debug Mode', action='store_true'
    )
    parser.set_defaults(DEBUG=True)
    return parser.parse_args()

def create_app():
    app = Flask(__name__, template_folder='templates')
    return app

app= create_app()

#Render the canvas page
@app.route('/')
def index():
    return render_template(
		'index2.html'
    )

#output the dice roll results
@app.route('/dice/results')
def die_results():
	#die_results = u'{"set":[{"type":"d6","labelColor":"#aaaaaa","dieColor":"#202020"},{"type":"d6","labelColor":"#aaaaaa","dieColor":"#202020"}],"constant":0}';
	return json.dumps(die_properties())
	#return die_results

#output of tables
@app.route('/tables')
def tables_result():
        return json.dumps(tables)

if __name__ == "__main__":
    args = get_args()
    app.run(debug=True,port=8000)
