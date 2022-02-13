import { useState } from 'react';
import { Popup } from 'react-leaflet';


const PeakPanel = ({ peak, onDelete, onCreate, onUpdate, onCancel }) => {

  const isCreating = !Boolean(peak.id);
  const [editing, setEditing] = useState(isCreating);
  const [name, setName] = useState(peak?.name || '');
  const [altitude, setAltitude] = useState(peak?.altitude || '');

  const handleChangeName = (event) => {
    setName(event.target.value);
  }

  const handleChangeAltitude = (event) => {
    setAltitude(event.target.value);
  }

  return (
    <Popup style={{ minWidth: '200px' }}>

      {editing && <h3>{isCreating ? 'Create' : 'Update'} a peak:</h3>}

      {editing ? (
        <div className="row mb-3">
          <label htmlFor="peakName" className="col-sm-4 col-form-label">
            Name:
          </label>
          <div className="col-sm-8">
            <input type="text" className="form-control" id="peakName"
              value={name} onChange={handleChangeName}
            ></input>
          </div>
        </div>
      ) : (
        <h3>{name}</h3>
      )
      }

      <div className="row mb-3">
        <label htmlFor="altitude" className="col-sm-4 col-form-label">
          Altitude (m.):
        </label>
        {editing ? (
          <div className="col-sm-8">
            <input type="text" className="form-control" id="peakAltitude"
              value={altitude} onChange={handleChangeAltitude}
            ></input>
          </div>
        ) : (
        <label className="col-sm-8 col-form-label">
          {altitude}
        </label>
        )
        }
      </div>

      <div className="row mb-3">
        <label htmlFor="altitude" className="col-sm-4 col-form-label">
          Latitude:
        </label>
        <label className="col-sm-8 col-form-label">
          {peak.lat}
        </label>
      </div>

      <div className="row mb-3">
        <label htmlFor="altitude" className="col-sm-4 col-form-label">
          Longitude:
        </label>
        <label className="col-sm-8 col-form-label">
          {peak.lon}
        </label>
      </div>
      
      {editing ? (
        <div style={{display:'flex', flexDirection: 'row', justifyContent: 'space-evenly'}}>
          <button type="button" className="btn btn-outline-danger btn-sm"
            onClick={() => {
              setEditing(false);
              if(isCreating) {
                onCancel();
              }
            }}
          >
            Cancel
          </button>
          <button type="button" className="btn btn-outline-primary btn-sm"
            onClick={() => {
              const upsertedPeak = {...peak, name, altitude};
              if(isCreating) {
                onCreate(upsertedPeak);
              } else {
                onUpdate(upsertedPeak);
              }
              setEditing(false);
            }}
          >
            Save
          </button>
        </div>
        ) : (
        <div style={{display:'flex', flexDirection: 'row', justifyContent: 'space-evenly'}}>
          <button type="button" className="btn btn-outline-danger btn-sm"
            onClick={() => onDelete(peak.id)}
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

export default PeakPanel;
