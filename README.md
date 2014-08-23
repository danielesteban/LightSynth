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

               PhotoR     10K
     +5V   o---/\/\/--.--/\/\/---o GND
                      |
    Pin A0 o-----------

These are two photoresistors for each hand. The left hand controls the pitch & the right hand controls the volume.

Enjoy! ;P

## Downloads
**v1.0.2:** (Aug 22, 2014)

 * Mac: [32bit, 10.7+](https://github.com/danielesteban/LightSynth/releases/download/v1.0.2/LightSynth-darwin.dmg)

![Connect View](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/connect.png)

![Main View](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/main.png)

## If you see this error...

![Gatekeeper error](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/gatekeeper1.png)

Right click on the app icon and select **open** from the contextual menu:

![App contextual menu](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/gatekeeper2.png)

Finally, select **open** when this dialog appears:

![Gatekeeper dialog](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/gatekeeper3.png)

## License
This code uses the MIT license, see the `LICENSE` file.
