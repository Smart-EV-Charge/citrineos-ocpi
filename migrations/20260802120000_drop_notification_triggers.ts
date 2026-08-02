// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

'use strict';

import { QueryInterface } from 'sequelize';

/**
 * ADAPTER-0007 — one-shot drop of all OCPI-owned notify triggers/functions on
 * CitrineOS tables. Run against the citrine DB once as an ops step; OCPI no
 * longer owns ongoing migrate against that database.
 *
 *   psql "$CITRINE_DATABASE_URL" -f dist/migrations/...  (or sequelize with a
 *   temporary bridge only for this drop — prefer raw SQL in evidence pack)
 */
export = {
  up: async (queryInterface: QueryInterface) => {
    const drops: Array<[string, string]> = [
      ['ChargingStationNotification', 'ChargingStations'],
      ['TransactionNotification', 'Transactions'],
      ['TariffNotification', 'Tariffs'],
      ['EvseNotification', 'Evses'],
      ['MeterValueNotification', 'MeterValues'],
      ['LocationNotification', 'Locations'],
      ['ConnectorNotification', 'Connectors'],
    ];

    for (const [trigger, table] of drops) {
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS "${trigger}" ON "${table}";`,
      );
    }

    const functions = [
      'ChargingStationNotify',
      'TransactionNotify',
      'TariffNotify',
      'EvseNotify',
      'MeterValueNotify',
      'LocationNotify',
      'ConnectorNotify',
    ];
    for (const fn of functions) {
      await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS "${fn}"();`);
    }
  },

  down: async () => {
    // Irreversible by design — recreate from 2025073012350* notification_* if needed.
    throw new Error(
      'ADAPTER-0007 drop cannot be reversed via migrate; re-apply notification_* migrations manually',
    );
  },
};
