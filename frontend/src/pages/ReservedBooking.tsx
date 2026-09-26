
import { useState } from 'react';
import { apiRequest } from '../api/client';

interface Station {
  id: number;
  code: string;
  name: string;
  city: string;
  state: string;
  platform_count?: number;
}

interface ClassAvailability {
  class_type: string;
  available_seats: number;
  total_seats?: number;
  fare: number;
}

interface Train {
  id: number;
  number: string;
  name: string;
  train_type?: string;
  source_station?: Station;
  destination_station?: Station;
  departure_time: string;
  arrival_time: string;
  duration?: string;
  running_days?: string[];
  classes?: ClassAvailability[];
  min_fare?: number;
}

export const ReservedBooking = () => {
  const today = new Date();

  const defaultDate = new Date(today);
  defaultDate.setDate(defaultDate.getDate() + 3);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const [fromStation, setFromStation] = useState<Station | null>({
    id: 1,
    code: 'BCT',
    name: 'Mumbai Central',
    city: 'Mumbai',
    state: 'Maharashtra',
    platform_count: 8,
  });

  const [toStation, setToStation] = useState<Station | null>({
    id: 7,
    code: 'NDLS',
    name: 'New Delhi',
    city: 'Delhi',
    state: 'Delhi',
    platform_count: 16,
  });

  const [journeyDate, setJourneyDate] = useState(
    formatDate(defaultDate)
  );

  const [selectedQuota, setSelectedQuota] = useState('GENERAL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [sortBy, setSortBy] = useState('departure');

  const [trains, setTrains] = useState<Train[]>([]);

  const [selectedClassMap, setSelectedClassMap] = useState<
    Record<number, ClassAvailability>
  >({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchTrains = async () => {
    if (!fromStation || !toStation) {
      setError('Please select both source and destination stations.');
      return;
    }

    if (fromStation.code === toStation.code) {
      setError('Source and destination stations cannot be the same.');
      return;
    }

    setLoading(true);
    setError('');
    setTrains([]);
    setSelectedClassMap({});

    try {
      const query =
        '/trains/search?from_station=' +
        encodeURIComponent(fromStation.code) +
        '&to_station=' +
        encodeURIComponent(toStation.code) +
        '&journey_date=' +
        encodeURIComponent(journeyDate) +
        '&travel_class=' +
        encodeURIComponent(selectedClass);

      console.log('Train search URL:', query);

      const data = await apiRequest<Train[]>(query);

      console.log('Train search response:', data);

      const trainList = Array.isArray(data) ? data : [];

      setTrains(trainList);

      const classMap: Record<number, ClassAvailability> = {};

      trainList.forEach((train) => {
        if (train.classes && train.classes.length > 0) {
          classMap[train.id] = train.classes[0];
        }
      });

      setSelectedClassMap(classMap);

      if (trainList.length === 0) {
        setError(
          'No trains found for this route and date. Try another date or station combination.'
        );
      }
    } catch (err: any) {
      console.error('Train search error:', err);

      let errorMessage = 'Unable to search trains. Please try again.';

      if (err && err.message) {
        errorMessage = String(err.message);
      } else if (err && err.detail) {
        errorMessage = String(err.detail);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const swapStations = () => {
    const oldFrom = fromStation;

    setFromStation(toStation);
    setToStation(oldFrom);

    setTrains([]);
    setSelectedClassMap({});
    setError('');
  };

  const selectClass = (
    trainId: number,
    classInfo: ClassAvailability
  ) => {
    setSelectedClassMap((previous) => ({
      ...previous,
      [trainId]: classInfo,
    }));
  };

  const formatTime = (time: string) => {
    if (!time) {
      return '--:--';
    }

    const parts = time.split(':');

    if (parts.length >= 2) {
      return parts[0] + ':' + parts[1];
    }

    return time;
  };

  const formatFare = (fare?: number) => {
    if (fare === undefined || fare === null) {
      return '₹--';
    }

    return '₹' + Number(fare).toLocaleString('en-IN');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Reserved Train Booking
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Search and book reserved railway tickets
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From
              </label>

              <div className="border rounded-lg px-4 py-3 bg-gray-50">
                <div className="text-xs text-gray-500">
                  Station
                </div>

                <div className="font-semibold text-gray-900">
                  {fromStation?.code}
                </div>

                <div className="text-sm text-gray-600">
                  {fromStation?.name}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={swapStations}
                className="w-10 h-10 rounded-full border bg-white hover:bg-gray-50 flex items-center justify-center"
                title="Swap stations"
              >
                ⇄
              </button>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>

              <div className="border rounded-lg px-4 py-3 bg-gray-50">
                <div className="text-xs text-gray-500">
                  Station
                </div>

                <div className="font-semibold text-gray-900">
                  {toStation?.code}
                </div>

                <div className="text-sm text-gray-600">
                  {toStation?.name}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="journey-date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Journey Date
              </label>

              <input
                id="journey-date"
                type="date"
                value={journeyDate}
                min={formatDate(today)}
                onChange={(event) =>
                  setJourneyDate(event.target.value)
                }
                className="w-full border rounded-lg px-4 py-3 bg-white"
              />
            </div>

            <div className="lg:col-span-3">
              <button
                type="button"
                onClick={searchTrains}
                disabled={loading}
                className="w-full rounded-lg px-5 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search Trains'}
              </button>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="quota"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Quota
              </label>

              <select
                id="quota"
                value={selectedQuota}
                onChange={(event) =>
                  setSelectedQuota(event.target.value)
                }
                className="w-full border rounded-lg px-3 py-2.5 bg-white"
              >
                <option value="GENERAL">General</option>
                <option value="LADIES">Ladies</option>
                <option value="SENIOR_CITIZEN">
                  Senior Citizen
                </option>
                <option value="TATKAL">Tatkal</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="travel-class"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Class
              </label>

              <select
                id="travel-class"
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(event.target.value)
                }
                className="w-full border rounded-lg px-3 py-2.5 bg-white"
              >
                <option value="ALL">All Classes</option>
                <option value="1A">1A - First AC</option>
                <option value="2A">2A - AC 2 Tier</option>
                <option value="3A">3A - AC 3 Tier</option>
                <option value="CC">CC - Chair Car</option>
                <option value="SL">SL - Sleeper</option>
                <option value="2S">2S - Second Sitting</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="sort-by"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sort By
              </label>

              <select
                id="sort-by"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
                className="w-full border rounded-lg px-3 py-2.5 bg-white"
              >
                <option value="departure">Departure</option>
                <option value="arrival">Arrival</option>
                <option value="duration">Duration</option>
                <option value="fare">Fare</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-bold text-gray-900">
            {trains.length} Trains Found
          </h2>

          {fromStation && toStation && (
            <p className="text-sm text-gray-500 mt-1">
              {fromStation.code} → {toStation.code} •{' '}
              {journeyDate}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <div className="font-semibold">
              Search Error
            </div>

            <div className="text-sm mt-1">
              {error}
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-6 bg-white border rounded-xl p-10 text-center">
            <div className="text-gray-600">
              Searching available trains...
            </div>
          </div>
        )}

        {!loading && trains.length === 0 && !error && (
          <div className="mt-6 bg-white border rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">
              🚆
            </div>

            <h3 className="text-lg font-semibold text-gray-900">
              Search for trains
            </h3>

            <p className="text-gray-500 mt-1">
              Select your journey details and click Search
              Trains.
            </p>
          </div>
        )}

        {!loading && trains.length > 0 && (
          <div className="mt-6 space-y-4">
            {trains.map((train) => {
              const selectedClassInfo =
                selectedClassMap[train.id];

              return (
                <div
                  key={train.id}
                  className="bg-white border rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-900">
                            {train.number}
                          </span>

                          <span className="text-lg font-semibold text-gray-800">
                            {train.name}
                          </span>
                        </div>

                        {train.train_type && (
                          <div className="text-sm text-gray-500 mt-1">
                            {train.train_type}
                          </div>
                        )}
                      </div>

                      {train.min_fare !== undefined && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            Starting from
                          </div>

                          <div className="text-xl font-bold text-gray-900">
                            {formatFare(train.min_fare)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatTime(
                            train.departure_time
                          )}
                        </div>

                        <div className="text-sm font-semibold text-gray-700">
                          {train.source_station?.code ||
                            fromStation?.code ||
                            'SOURCE'}
                        </div>

                        <div className="text-xs text-gray-500">
                          {train.source_station?.name ||
                            fromStation?.name ||
                            ''}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm text-gray-500">
                          {train.duration || 'Journey'}
                        </div>

                        <div className="my-2 text-gray-400">
                          ────────▶
                        </div>

                        <div className="text-xs text-gray-500">
                          Direct Train
                        </div>
                      </div>

                      <div className="md:text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatTime(
                            train.arrival_time
                          )}
                        </div>

                        <div className="text-sm font-semibold text-gray-700">
                          {train.destination_station?.code ||
                            toStation?.code ||
                            'DESTINATION'}
                        </div>

                        <div className="text-xs text-gray-500">
                          {train.destination_station?.name ||
                            toStation?.name ||
                            ''}
                        </div>
                      </div>
                    </div>

                    {train.classes &&
                      train.classes.length > 0 && (
                        <div className="mt-6 pt-5 border-t">
                          <div className="text-sm font-semibold text-gray-800 mb-3">
                            Available Classes
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {train.classes.map(
                              (classInfo) => {
                                const isSelected =
                                  selectedClassInfo?.class_type ===
                                  classInfo.class_type;

                                return (
                                  <button
                                    key={
                                      train.id +
                                      '-' +
                                      classInfo.class_type
                                    }
                                    type="button"
                                    onClick={() =>
                                      selectClass(
                                        train.id,
                                        classInfo
                                      )
                                    }
                                    className={
                                      isSelected
                                        ? 'border border-blue-600 bg-blue-50 rounded-lg px-4 py-3 text-left'
                                        : 'border border-gray-200 bg-white hover:border-blue-300 rounded-lg px-4 py-3 text-left'
                                    }
                                  >
                                    <div className="font-semibold text-gray-900">
                                      {
                                        classInfo.class_type
                                      }
                                    </div>

                                    <div className="text-sm text-gray-600">
                                      {
                                        classInfo.available_seats
                                      }{' '}
                                      seats
                                    </div>

                                    <div className="text-sm font-semibold text-gray-900 mt-1">
                                      {formatFare(
                                        classInfo.fare
                                      )}
                                    </div>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-sm text-gray-600">
                        {selectedClassInfo ? (
                          <>
                            Selected:{' '}
                            <span className="font-semibold text-gray-900">
                              {
                                selectedClassInfo.class_type
                              }
                            </span>{' '}
                            •{' '}
                            <span className="font-semibold text-gray-900">
                              {formatFare(
                                selectedClassInfo.fare
                              )}
                            </span>
                          </>
                        ) : (
                          'Select a class to continue'
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!selectedClassInfo}
                        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue to Booking
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservedBooking;

