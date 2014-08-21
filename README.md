LightSynth
=========
Node-webkit app for translating light into midi notes.

You'll need an arduino compatible board. Upload the `LightSynth.ino` sketch to it and hook up 4 photoresistors in this fashion:

               PhotoR     10K
     +5V   o---/\/\/--.--/\/\/---o GND
                      |
    Pin A0 o-----------

These are two photoresistors for each hand. The left hand controls the pitch & the right hand controls the volume.

Enjoy! ;P

## Downloads
**v1.0.0:**

 * Mac: [32bit, 10.7+](https://github.com/danielesteban/LightSynth/releases/download/v1.0.0/LightSynth-v.1.0.0.dmg)

![Connect View](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/connect.png)

![Main View](https://raw.githubusercontent.com/danielesteban/LightSynth/master/screenshots/main.png)

## License
This code uses the MIT license, see the `LICENSE` file.
