-- ADAPTER-0007 one-shot: drop OCPI-owned notify triggers/functions from CitrineOS DB.
-- Run once with a privileged citrine role, then revoke OCPI DB grants.

DROP TRIGGER IF EXISTS "ChargingStationNotification" ON "ChargingStations";
DROP TRIGGER IF EXISTS "TransactionNotification" ON "Transactions";
DROP TRIGGER IF EXISTS "TariffNotification" ON "Tariffs";
DROP TRIGGER IF EXISTS "EvseNotification" ON "Evses";
DROP TRIGGER IF EXISTS "MeterValueNotification" ON "MeterValues";
DROP TRIGGER IF EXISTS "LocationNotification" ON "Locations";
DROP TRIGGER IF EXISTS "ConnectorNotification" ON "Connectors";

DROP FUNCTION IF EXISTS "ChargingStationNotify"();
DROP FUNCTION IF EXISTS "TransactionNotify"();
DROP FUNCTION IF EXISTS "TariffNotify"();
DROP FUNCTION IF EXISTS "EvseNotify"();
DROP FUNCTION IF EXISTS "MeterValueNotify"();
DROP FUNCTION IF EXISTS "LocationNotify"();
DROP FUNCTION IF EXISTS "ConnectorNotify"();
