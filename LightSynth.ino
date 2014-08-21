#define numPhotoResistors 4
#define numReadings 10
const byte pins[numPhotoResistors] = {A0, A1, A2, A3};

unsigned long lastRead = 0;
int reading = 0;
int readings[numPhotoResistors][numReadings];
int read[numPhotoResistors];
int sum[numPhotoResistors];

void setup() {
	for(byte j=0; j<numPhotoResistors; j++) {
		read[j] = 0;
		sum[j] = 0;
		for(byte i=0; i<numReadings; i++) {
			readings[j][i] = 0;
		}
	}
	Serial.begin(115200);
}

void loop() {
	unsigned long t = millis();
	if(t < lastRead + 1) return;
	lastRead = t;
	for(byte j=0; j<numPhotoResistors; j++) {
		sum[j] -= readings[j][reading];
		readings[j][reading] = analogRead(pins[j]);
		sum[j] += readings[j][reading];
		int r = round((float) sum[j] / (float) numReadings);
		if(abs(read[j] - r) <= 1) continue;
		r < 2 && (r = 0);
		r > 1021 && (r = 1023);
		read[j] = r;
		Serial.write(j);
		Serial.print(read[j], DEC);
		Serial.write('\n');
	}
	++reading >= numReadings && (reading = 0);
}
