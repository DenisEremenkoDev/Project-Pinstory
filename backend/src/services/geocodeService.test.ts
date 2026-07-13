import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchGeocode } from './geocodeService'

describe('searchGeocode', () => {
  const originalKey = process.env.YANDEX_GEOCODER_API_KEY

  beforeEach(() => {
    process.env.YANDEX_GEOCODER_API_KEY = 'test-key'
  })

  afterEach(() => {
    process.env.YANDEX_GEOCODER_API_KEY = originalKey
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('maps Yandex Point.pos ("longitude latitude") to the correct latitude/longitude fields', async () => {
    // Real Yandex Geocoder response shape for a Saint Petersburg landmark.
    const mockResponse = {
      response: {
        GeoObjectCollection: {
          featureMember: [
            {
              GeoObject: {
                name: 'Эрмитаж',
                Point: { pos: '30.314492 59.939844' }, // Yandex order: "lon lat"
                metaDataProperty: {
                  GeocoderMetaData: { text: 'Россия, Санкт-Петербург, Дворцовая площадь, 2' },
                },
              },
            },
          ],
        },
      },
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) }),
    )

    const results = await searchGeocode('Эрмитаж')

    expect(results).toHaveLength(1)
    // The coordinate-order trap this project has a documented history of
    // (.claude/rules/map.md): pos is "lon lat", never "lat lon". If this ever
    // gets swapped, every pin from geosuggest lands in the wrong place.
    expect(results[0]).toEqual({
      name: 'Эрмитаж',
      address: 'Россия, Санкт-Петербург, Дворцовая площадь, 2',
      latitude: 59.939844,
      longitude: 30.314492,
    })
  })

  it('throws 503 GEOCODER_UNAVAILABLE when no API key is configured', async () => {
    delete process.env.YANDEX_GEOCODER_API_KEY

    await expect(searchGeocode('test')).rejects.toMatchObject({
      statusCode: 503,
      code: 'GEOCODER_UNAVAILABLE',
    })
  })

  it('throws 502 GEOCODER_ERROR when the upstream request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    await expect(searchGeocode('test')).rejects.toMatchObject({
      statusCode: 502,
      code: 'GEOCODER_ERROR',
    })
  })

  it('throws 502 GEOCODER_ERROR (not an empty result list) when Yandex returns HTTP 200 with an error-shaped body', async () => {
    // Yandex returns 200 for some auth/quota failures too, with `{ error: { message } }`
    // instead of `response`. This must NOT be silently coerced into "zero matches" —
    // that's indistinguishable from a real empty search and impossible to diagnose.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: { message: 'Invalid key' } }),
      }),
    )

    await expect(searchGeocode('test')).rejects.toMatchObject({
      statusCode: 502,
      code: 'GEOCODER_ERROR',
    })
  })
})
