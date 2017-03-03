CREATE TABLE readings
(
    id INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    dateTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    power DECIMAL(8,2) NOT NULL,
    powerPhase1 DECIMAL(6,2),
    powerPhase2 DECIMAL(6,2),
    powerPhase3 DECIMAL(6,2),
    energyReading DECIMAL(6,2) NOT NULL,
    userId INT(11) NOT NULL
);
CREATE UNIQUE INDEX power_dateTime_uindex ON readings (dateTime, userId);
CREATE UNIQUE INDEX power_readings_id_uindex ON readings (id);
CREATE INDEX readings_userId_index ON readings (userId);
