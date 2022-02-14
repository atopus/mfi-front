
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

import PeakPanel from './Panel'


const API_ENDPOINT = `http://${process.env?.REACT_APP_API_HOST || 'localhost'}:${process.env?.REACT_APP_API_PORT || '8000'}/api`;


function MapPlaceholder() {
  return (
    <p>
      Peak map.{' '}
      <noscript>You need to enable JavaScript to see this map.</noscript>
    </p>
  )
}


const LocationMarker = (props) => {
  const { onCreate, onRefresh } = props;

  const [position, setPosition] = useState(null);

  const onCancel = () => {
    setPosition(null);
  }

  const map = useMapEvents({
    click: (e) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
    moveend: () => {
      onRefresh(map);
    },
    zoomend: () => {
      onRefresh(map);
    },
    locationfound: (e) => {
      map.flyTo(e.latlng, map.getZoom());
    }
  })

  const onMarkerCreate = (newPeak) => {
    setPosition(null);
    onCreate(newPeak);
  }

  return position === null ? null : (
    <Marker position={position}>
      <PeakPanel
        onCreate={onMarkerCreate}
        peak={{lat: position.lat.toFixed(4), lon: position.lng.toFixed(4)}}
        onCancel={onCancel}
      />
    </Marker>
  )
}

const Map = () => {

  const [peaks, setPeaks] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const onCreate = async (newPeak) => {
    try {
      const options ={
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newPeak)
      }
      const response = await fetch(`${API_ENDPOINT}/peaks/`, options);
      if(response.ok) {
        const payload = await response.json();
        setPeaks([...peaks, payload]);
      } else {
        console.debug(response);
      }

    } catch(error) {

    }
  }

  const onUpdate = async (peak) => {
    try {
      const options ={
        method: 'PUT',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(peak)
      }
      const response = await fetch(`${API_ENDPOINT}/peaks/${peak.id}/`, options);
      if(response.ok) {
        const payload = await response.json();
        setPeaks(...[peaks.filter((_peak) => _peak.id !== peak.id), payload]);
      } else {
        console.error(response);
      }

    } catch(error) {

    }
  }

  const onDelete = async (peakId) => {
    try {
      const response = await fetch(`${API_ENDPOINT}/peaks/${peakId}/`,
      {method: 'DELETE'});
      if(response.ok) {
        setPeaks(peaks.filter(peak => peak.id !== peakId));
      } else {
        console.error(response);
      }
    } catch(error) {
      console.error(error);
    }
  }

  const onRefresh = (map) => {
    loadPeaks(map);
  }
  
  const loadPeaks = async (map) => {
    const box = map.getBounds();
    const options = {
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
    };
    try {
      const endpoint = `${API_ENDPOINT}/peaks`;
      //TODO: improve this query string.
      const query = `n=${box.getNorth()}&s=${box.getSouth()}&w=${box.getWest()}&e=${box.getEast()}`;
      const response = await fetch(`${endpoint}?${query}`, options);
      const data = await response.json();
      // console.log(data); 
      const existingIds = new Set(peaks.map(p => p.id));
      setPeaks([...peaks, ...data.filter(d => !existingIds.has(d.id))]);
    } catch(error) {
      //TODO: deal with errors, eg. missing coordinate.
      console.error(error);
    }
  }

  const init = (map) => {
    if(!initialized) {
      // console.log("Call loadPeaks.");
      loadPeaks(map);
      setInitialized(true);
    }
  }

  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} className="map"
    MapPlaceholder={<MapPlaceholder />} whenCreated={init}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {peaks.map((marker, i) => (
          <Marker position={[marker.lat, marker.lon]} key={i}>
            <PeakPanel
              peak={marker}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          </Marker>
        )
      )}
      <LocationMarker onCreate={onCreate} onRefresh={onRefresh} />
    </MapContainer>
  );
}

export default Map;
