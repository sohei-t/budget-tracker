/**
 * Unit Tests: Network Utilities
 *
 * Tests getLocalIP function for LAN address detection.
 */

'use strict';

const os = require('os');
const { getLocalIP } = require('../../../src/utils/networkUtils');

describe('getLocalIP', () => {
  test('should return a valid IPv4 address on a machine with network interfaces', () => {
    const ip = getLocalIP();
    // Should return either a real IP or the fallback
    expect(ip).toBeDefined();
    expect(typeof ip).toBe('string');
    // Valid IPv4 pattern
    expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  });

  test('should return 127.0.0.1 when no external IPv4 interface exists', () => {
    const spy = jest.spyOn(os, 'networkInterfaces').mockReturnValue({
      lo0: [
        { family: 'IPv4', internal: true, address: '127.0.0.1' }
      ]
    });

    const ip = getLocalIP();
    expect(ip).toBe('127.0.0.1');
    spy.mockRestore();
  });

  test('should return first external IPv4 address', () => {
    const spy = jest.spyOn(os, 'networkInterfaces').mockReturnValue({
      en0: [
        { family: 'IPv6', internal: false, address: 'fe80::1' },
        { family: 'IPv4', internal: false, address: '192.168.1.100' }
      ],
      en1: [
        { family: 'IPv4', internal: false, address: '10.0.0.5' }
      ]
    });

    const ip = getLocalIP();
    expect(ip).toBe('192.168.1.100');
    spy.mockRestore();
  });

  test('should return 127.0.0.1 when no interfaces exist', () => {
    const spy = jest.spyOn(os, 'networkInterfaces').mockReturnValue({});
    const ip = getLocalIP();
    expect(ip).toBe('127.0.0.1');
    spy.mockRestore();
  });

  test('should skip IPv6 addresses', () => {
    const spy = jest.spyOn(os, 'networkInterfaces').mockReturnValue({
      en0: [
        { family: 'IPv6', internal: false, address: 'fe80::1' },
        { family: 'IPv6', internal: false, address: '::1' }
      ]
    });

    const ip = getLocalIP();
    expect(ip).toBe('127.0.0.1');
    spy.mockRestore();
  });
});
