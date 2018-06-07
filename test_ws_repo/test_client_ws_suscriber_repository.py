#!/usr/bin/python
#Author: J.M.Montañana HLRS 2018
#  If you find any bug, please notify to hpcjmont@hlrs.de
#
#  Copyright (C) 2018 University of Stuttgart
#
# The objective is to test the WebSocket service from the Respository
# when using a python client
# This python-script suscribes to the updates in 2 projects and one task.
# prints in the screen the notifications it receives.
#
# You may need to install a package with the command: pip install websocket-client
#
import websocket 
import json
import thread
from time import sleep
  
def on_message(ws, message):
    print "Received '%s'" % message 

def on_error(ws, error):
    print error
    
def on_close(ws):
    print "### closed ###"

def on_open(ws):
    def run(*args):
        msg_counter = 0
        ws.send(json.dumps({"user":"ian.gray@york.ac.uk" , "project":"demo_hpc"}))  
        ws.send(json.dumps({"user":"ian.gray@york.ac.uk" , "project":"phantom_tools_on_HPC"})) 
        ws.send(json.dumps({"user":"ian.gray@york.ac.uk" , "source":"PT"}))         
        while True:
            sleep(5)
            print('Hello world %d'%msg_counter)
            msg_counter += 1
        sleep(1)
        ws.close()
    thread.start_new_thread(run, ())

if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("ws://localhost:8000", on_message = on_message, on_error = on_error, on_close = on_close)
    if ws:
        print "WS ok"
    else:
        print "WS no OK"

    ws.on_open = on_open
    ws.run_forever()  
