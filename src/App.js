import './App.css';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, MapConsumer } from 'react-leaflet';


const API_ENDPOINT = `http://${process.env?.REACT_APP_API_HOST || 'localhost'}:${process.env?.REACT_APP_API_PORT || '8000'}/api`;


const PeakPanel = ({ marker, onDelete }) => {

  const [editing, setEditing] = useState(false);

  return (
    <Popup>
      <h3>{marker.name}</h3>

      <p>Altitude: {marker.altitude} m.</p>
      <p>Latitude: {marker.lat}</p>
      <p>Longitude: {marker.lon}</p>
      
      {editing ? (
        <div style={{display:'flex', flexDirection: 'row', justifyContent: 'space-evenly'}}>
          <button type="button" className="btn btn-outline-danger btn-sm"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
          <button type="button" className="btn btn-outline-primary btn-sm"
            onClick={() => setEditing(true)}
          >
            Save
          </button>
        </div>
        ) : (
        <div style={{display:'flex', flexDirection: 'row', justifyContent: 'space-evenly'}}>
          <button type="button" className="btn btn-outline-danger btn-sm"
            onClick={() => onDelete(marker.id)}
          >
            Delete
          </button>
          <button type="button" className="btn btn-outline-primary btn-sm"
            onClick={() => setEditing(true)}
          >
            Update
          </button>
        </div>
      )}
    </Popup>
  )
}

function MapPlaceholder() {
  return (
    <p>
      Peak map.{' '}
      <noscript>You need to enable JavaScript to see this map.</noscript>
    </p>
  )
}

const PeakForm = (props) => {

  const { onCreate, position, onCancel } = props;

  const [name, setName] = useState('');
  const [altitude, setAltitude] = useState('');

  const handleChangeName = (event) => {
    setName(event.target.value);
  }

  const handleChangeAltitude = (event) => {
    setAltitude(event.target.value);
  }

  return (
    <form style={{minWidth: '200px'}}>
      <div className="row mb-3">
        <label for="peakName" className="col-sm-4 col-form-label">
          Name:
        </label>
        <div className="col-sm-8">
          <input type="text" className="form-control" id="peakName"
            onChange={handleChangeName}
          ></input>
        </div>
      </div>
      <div className="row mb-3">
        <label for="altitude" className="col-sm-4 col-form-label">
          Altitude:
        </label>
        <div className="col-sm-8">
          <input type="text" className="form-control" id="peakName"
            value={altitude} onChange={handleChangeAltitude}
          ></input>
        </div>
      </div>

      <div className="row mb-3">
        <label for="altitude" className="col-sm-4 col-form-label">
          Latitude:
        </label>
        <div className="col-sm-8">
          <p>{position.lat}</p>
        </div>
      </div>

      <div className="row mb-3">
        <label for="altitude" className="col-sm-4 col-form-label">
          Longitude:
        </label>
        <div className="col-sm-8">
          <p>{position.lng}</p>
        </div>
      </div>
      
      <div style={{display:'flex', flexDirection: 'row', justifyContent: 'space-evenly'}}>
      <button type="button" className="btn btn-danger btn-sm"
          onClick={onCancel}
        > 
          Cancel
        </button>
        <button type="button" className="btn btn-primary btn-sm"
          onClick={() => onCreate({name, altitude, position})}
        > 
          Save
        </button>
      </div>
    </form>
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
      console.log(map.getBounds());
      onRefresh(map);
    },
    zoomend: () => {
      console.log(map.getBounds());
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
      <Popup>
        <PeakForm
          onCreate={onMarkerCreate}
          position={position}
          onCancel={onCancel}
        />
      </Popup>
    </Marker>
  )
}

function App() {

  const [peaks, setPeaks] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const onCreate = async (newPeak) => {
    const data = {
      name: newPeak.name,
      altitude: newPeak.altitude,
      lat: newPeak.position.lat,
      lon: newPeak.position.lng

    }
    try {
      const options ={
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
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

  const onDelete = async (peakId) => {
    try {
      const response = await fetch(`${API_ENDPOINT}/peaks/${peakId}/`,
      {method: 'DELETE'});
      if(response.ok) {
        setPeaks(peaks.filter(peak => peak.id !== peakId))
      }
    } catch(error) {

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
      console.log(data);
      setPeaks(data);
    } catch(error) {
      //TODO: deal with errors, eg. missing coordinate.
      console.error(error);
    }
  }

  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} className="map"
    MapPlaceholder={<MapPlaceholder />}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {peaks.map((marker, i) => (
          <Marker position={[marker.lat, marker.lon]} key={i}>
            <PeakPanel marker={marker} onDelete={onDelete} />
          </Marker>
        )
      )}
      <MapConsumer>
        {(map) => {
          if(!initialized) {
            console.log("Call loadPeaks.");
            loadPeaks(map);
            setInitialized(true);
          }
          return null;
        }}
      </MapConsumer>
      <LocationMarker onCreate={onCreate} onRefresh={onRefresh} />
    </MapContainer>
  );
}

export default App;
