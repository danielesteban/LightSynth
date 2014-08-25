			    _       _         _      _     _____                _    _     
			   | |     (_)       | |    | |   / ____|              | |  | |    
			   | |      _   __ _ | |__  | |_ | (___   _   _  _ __  | |_ | |__  
			   | |     | | / _` || '_ \ | __| \___ \ | | | || '_ \ | __|| '_ \ 
			   | |____ | || (_| || | | || |_  ____) || |_| || | | || |_ | | | |
			   |______||_| \__, ||_| |_| \__||_____/  \__, ||_| |_| \__||_| |_|
			                __/ |                      __/ |                   
			               |___/                      |___/                    

	---------------------------------------------------------------------------------------

Desktop app for translating light into midi messages.

You'll need an arduino compatible board.

Upload the `LightSynth.ino` sketch to it and hook up 4 photoresistors in this fashion:

![Breadboard](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/breadboard.png)

These are two photoresistors for each hand/axis. Each of the axis can control the pitch, the volume and send 2 FX midi control messages. It also includes a stroke feature and a dubstepian cut-off.

I used photoresistors because I was looking for a theremin feel... but you can connect almost any other analog inputs to it (Potentiometers, Thermistors, A touch panel, etc...)

Enjoy! ;P

## Downloads
**v1.1.0:** (Aug 24, 2014)

 * Mac: [32bit, 10.7+](https://github.com/danielesteban/LightSynth/releases/download/v1.1.0/LightSynth-darwin.dmg)

![Connect View](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/connect.png)

![Synth View](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/synth.png)

![Sequencer View](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/sequencer.png)

## If you see this error...

![Gatekeeper error](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/gatekeeper1.png)

Right click on the app icon and select **open** from the contextual menu:

![App contextual menu](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/gatekeeper2.png)

Finally, select **open** when this dialog appears:

![Gatekeeper dialog](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/gatekeeper3.png)

## License
This code uses the MIT license, see the `LICENSE` file.
