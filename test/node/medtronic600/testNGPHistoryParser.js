/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2017, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

/* global beforeEach, describe, it */

import { expect } from 'chai';

import NGPHistoryParser from '../../../lib/drivers/medtronic600/NGPHistoryParser';
import builder from '../../../lib/objectBuilder';
import TZOUtil from '../../../lib/TimezoneOffsetUtil';

describe('NGPHistoryParser.js', () => {
  const tzoUtil = new TZOUtil('GMT', '2016-12-01T00:00:00.000Z', []);
  const cfg = {
    builder: builder(),
    tzoUtil,
  };
  const settings = {};

  describe('wizard', () => {
    it('should add bolus record with matching programmed event to wizard', () => {
      const bolusProgrammedData = '150016822dff2e9e029f8e01aa0000014dfc000032c8';
      const bolusCompleteData = 'dc001a822dff189e029f8e01aa0000014dfc00014dfc000032c8';
      const wizardData = '3d0035822dfdd69e029f8e01000000003c002300000046003200370000000000014dfc000032c80000000000014dfc000000014dfc';
      const historyParser = new NGPHistoryParser(
        cfg, settings,
        [bolusProgrammedData + wizardData + bolusCompleteData],
      );
      const events = [];

      const expected = {
        bgTarget: {
          high: 5.5,
          low: 5,
        },
        bolus: {
          clockDriftOffset: 0,
          conversionOffset: 0,
          deviceTime: '2017-02-10T15:54:36',
          normal: 8.55,
          payload: {
            logIndices: [
              2184052526,
            ],
          },
          subType: 'normal',
          time: '2017-02-10T15:54:36.000Z',
          timezoneOffset: 0,
          type: 'bolus',
        },
        carbInput: 60,
        clockDriftOffset: 0,
        conversionOffset: 0,
        deviceTime: '2017-02-10T15:48:52',
        index: 2184052182,
        insulinCarbRatio: 7,
        insulinOnBoard: 1.3,
        insulinSensitivity: 3.5,
        jsDate: new Date('2017-02-10T15:48:52.000Z'),
        payload: {
          logIndices: [
            2184052182,
          ],
        },
        recommended: {
          carb: 8.55,
          correction: 0,
          net: 8.55,
        },
        time: '2017-02-10T15:48:52.000Z',
        timezoneOffset: 0,
        type: 'wizard',
        units: 'mmol/L',
      };

      historyParser.buildNormalBolusRecords(events);
      expect(events[0]).to.deep.equal(expected);
    });

    it('should ignore a bolus record without a matching programmed event', () => {
      const bolusData = 'dc001a822dff2e9e029f8e01aa0000014dfc00014dfc000032c8';
      const wizardData = '3d0035822dfdd69e029f8e01000000003c002300000046003200370000000000014dfc000032c80000000000014dfc000000014dfc';
      const historyParser = new NGPHistoryParser(cfg, settings, [wizardData + bolusData]);
      const events = [];

      const expected = undefined;

      historyParser.buildNormalBolusRecords(events);
      expect(events[0]).to.deep.equal(expected);
    });
  });

  describe('suspend', () => {
    it('should calculate the correct suspend duration', () => {
      const suspendData = '1e000c81ee52f6a092886601';
      const resumeData = '1f000c81ee56b5a092886602';
      const historyParser = new NGPHistoryParser(cfg, settings, [suspendData + resumeData]);
      const events = [];

      const expected = {
        time: '2018-05-05T21:15:08.000Z',
        timezoneOffset: 0,
        clockDriftOffset: 0,
        conversionOffset: 0,
        deviceTime: '2018-05-05T21:15:08',
        type: 'deviceEvent',
        subType: 'status',
        status: 'suspended',
        reason: { suspended: 'automatic', resumed: 'manual' },
        duration: 959000,
        payload: {
          suspended: { cause: 'Alarm suspend' },
          resumed: { cause: 'User cleared alarm' },
          logIndices: [2179879670],
        },
        index: 2179879670,
        jsDate: new Date('2018-05-05T21:15:08.000Z'),
      };

      historyParser.buildSuspendResumeRecords(events);
      expect(events[0]).to.deep.equal(expected);
    });
  });
});