import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Clock, MapPin, AlertTriangle, Upload, ArrowRight, Compass, Search, Image as ImageIcon } from 'lucide-react';
import Map from '../components/Map';
import { createDonation } from '../services/donationAPI';
import { detectCurrentLocation, reverseGeocode, forwardGeocode } from '../services/locationService';
import '../styles/donation.css';

const DEFAULT_HOURS = {
  'Cooked gravy-based food': 2,
  'Cooked dry food': 4,
  'Fresh-cut fruits/vegetables': 3,
  'Packaged/sealed food': 24,
  'Bakery items': 8
};

export default function CreateDonation({ token }) {
  const [foodName, setFoodName] = useState('');
  const [foodCategory, setFoodCategory] = useState('Cooked gravy-based food');
  const [foodWeight, setFoodWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('Meals');
  const [description, setDescription] = useState('');
  const [prepDate, setPrepDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [prepTime, setPrepTime] = useState(() => new Date().toTimeString().substring(0, 5));
  const [pickupAddress, setPickupAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [windowHours, setWindowHours] = useState('2');
  const [windowMinutes, setWindowMinutes] = useState('0');
  const [error, setError] = useState('');
  const [geoMsg, setGeoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const navigate = useNavigate();

  const handleCategoryChange = (e) => {
    const selected = e.target.value;
    setFoodCategory(selected);
    const defH = DEFAULT_HOURS[selected] || 2;
    setWindowHours(defH.toString());
    setWindowMinutes('0');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Map click location handler
  const handleMapLocationSelect = async ({ lat, lng }) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    setGeoMsg(`⏳ Resolving address for Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}...`);
    setError('');
    try {
      const addr = await reverseGeocode(lat, lng);
      if (addr.fullAddress) setPickupAddress(addr.fullAddress);
      setGeoMsg(`📍 Pickup Location: ${addr.fullAddress || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`}`);
    } catch (e) {
      setGeoMsg(`📍 Selected Coordinates: Lat ${lat}, Lng ${lng}`);
    }
  };

  // High-accuracy Current Location button handler (GPS + IP fallback)
  const handleGetCurrentLocation = async () => {
    setLocating(true);
    setGeoMsg('⏳ Detecting your current location...');
    setError('');
    try {
      const loc = await detectCurrentLocation();
      setLatitude(loc.lat.toString());
      setLongitude(loc.lng.toString());

      setGeoMsg('⏳ Resolving street address...');
      const addr = await reverseGeocode(loc.lat, loc.lng);
      if (addr.fullAddress) setPickupAddress(addr.fullAddress);

      setGeoMsg(`${loc.message} ➔ 📍 ${addr.fullAddress || `Lat: ${loc.lat}, Lng: ${loc.lng}`}`);
    } catch (err) {
      setError(err.message || 'Location permission denied. Please click on the map to pin pickup coordinates.');
      setGeoMsg('💡 Click anywhere on the map to pinpoint exact pickup coordinates.');
    } finally {
      setLocating(false);
    }
  };

  // Locate from typed pickup address
  const handleLocateAddress = async () => {
    if (!pickupAddress || pickupAddress.trim().length < 2) {
      setError('Please type a pickup street address or PIN code first to locate.');
      return;
    }
    setLocating(true);
    setError('');
    setGeoMsg(`⏳ Searching map coordinates for "${pickupAddress}"...`);
    try {
      const res = await forwardGeocode(pickupAddress);
      setLatitude(res.lat.toString());
      setLongitude(res.lng.toString());
      setPickupAddress(res.fullAddress || pickupAddress);
      setGeoMsg(`🎯 Found & Pinned on Map: ${res.displayName || res.fullAddress}`);
    } catch (err) {
      setError(err.message || 'Address not found. Please click directly on the interactive map.');
      setGeoMsg('💡 Click anywhere on the interactive map to set pickup pin.');
    } finally {
      setLocating(false);
    }
  };

  const parsedHours = parseInt(windowHours, 10) || 0;
  const parsedMins = parseInt(windowMinutes, 10) || 0;
  const totalSafeHours = parsedHours + (parsedMins / 60);
  const maxThresholdHours = DEFAULT_HOURS[foodCategory] || 4;

  const getPreviewSafeUntil = () => {
    try {
      if (!prepDate || !prepTime) return null;
      const prep = new Date(`${prepDate}T${prepTime}:00`);
      if (isNaN(prep.getTime())) return null;
      const safeDate = new Date(prep.getTime() + totalSafeHours * 3600 * 1000);
      return safeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) + ', ' + safeDate.toLocaleDateString([], { day: 'numeric', month: 'short' });
    } catch (e) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!foodName || foodName.trim() === '') {
      return setError('Food name is required.');
    }
    const weightNum = parseFloat(foodWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      return setError('Please enter a valid food weight in kilograms (kg).');
    }
    const hasCustomQty = Boolean(quantity && parseFloat(quantity) > 0);
    const qtyNum = hasCustomQty ? parseFloat(quantity) : weightNum;
    const effectiveUnit = hasCustomQty ? (quantityUnit || 'Meals') : 'kg';
    if (!pickupAddress || pickupAddress.trim() === '') {
      return setError('Pickup location address is required. Please click on the map or type your address.');
    }
    const latNum = parseFloat(latitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return setError('Valid pickup latitude coordinates (-90 to 90) are required.');
    }
    const lngNum = parseFloat(longitude);
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return setError('Valid pickup longitude coordinates (-180 to 180) are required.');
    }

    if (totalSafeHours <= 0) {
      return setError('Food safe collection window must be greater than zero (minimum 15 minutes).');
    }
    if (totalSafeHours > maxThresholdHours) {
      return setError(`Food safe collection window cannot exceed maximum safety threshold of ${maxThresholdHours} hours for ${foodCategory}.`);
    }

    setLoading(true);

    try {
      const preparationTimeStr = `${prepDate}T${prepTime}:00`;
      const res = await createDonation({
        food_name: foodName.trim(),
        food_category: foodCategory,
        quantity: qtyNum,
        quantity_unit: effectiveUnit,
        weight_kg: weightNum,
        servings: hasCustomQty ? qtyNum : null,
        description: description.trim(),
        preparation_time: preparationTimeStr,
        pickup_address: pickupAddress.trim(),
        latitude: latNum,
        longitude: lngNum,
        image_url: imagePreview,
        custom_safe_hours: totalSafeHours
      }, token);

      if (res.success) {
        alert('Surplus Food Listing Created & Matched Successfully!');
        navigate('/donor/dashboard');
      } else {
        setError(res.message || 'Could not create food listing.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="form-card">
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.5rem', color: '#111827' }}>
          Create Surplus Food Listing 🍲
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Publish excess edible food. Click on the map to pin exact pickup location for NGO collection.
        </p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {geoMsg && (
          <div style={{ background: '#f0fdf4', color: '#15803d', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
            {geoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Food Details */}
          <div className="form-group">
            <label className="form-label">Food Item Name *</label>
            <input 
              type="text" 
              className="form-input" 
              value={foodName} 
              onChange={(e) => setFoodName(e.target.value)} 
              placeholder="e.g. Fresh Veg Pulao & Curry" 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Food Category *</label>
              <select className="form-select" value={foodCategory} onChange={handleCategoryChange}>
                <option value="Cooked gravy-based food">Cooked Gravy-Based Food</option>
                <option value="Cooked dry food">Cooked Dry Food</option>
                <option value="Fresh-cut fruits/vegetables">Fresh-Cut Fruits / Vegetables</option>
                <option value="Packaged/sealed food">Packaged / Sealed Food</option>
                <option value="Bakery items">Bakery Items</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Food Weight (kg) *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  value={foodWeight} 
                  onChange={(e) => setFoodWeight(e.target.value)} 
                  placeholder="e.g. 25" 
                  min="0.1" 
                  step="0.1" 
                  required 
                />
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 1.25rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontWeight: '800',
                  color: '#111827',
                  fontSize: '0.9rem'
                }}>
                  kg
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity / Servings (Optional)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  placeholder="e.g. 50" 
                  min="1" 
                />
                <select 
                  className="form-select" 
                  style={{ width: '130px' }} 
                  value={quantityUnit} 
                  onChange={(e) => setQuantityUnit(e.target.value)}
                >
                  <option value="Meals">Meals</option>
                  <option value="Packets">Packets</option>
                  <option value="Boxes">Boxes</option>
                  <option value="Portions">Portions</option>
                  <option value="Trays">Trays</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description / Dietary Notes</label>
            <textarea 
              className="form-textarea" 
              rows="3" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="e.g. Pure vegetarian, prepared 1 hour ago for catered event." 
            />
          </div>

          {/* Preparation Timestamp */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Preparation Date *</label>
              <input type="date" className="form-input" value={prepDate} onChange={(e) => setPrepDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Preparation Time *</label>
              <input type="time" className="form-input" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} required />
            </div>
          </div>

          {/* Safe Collection Window (Hours & Minutes) */}
          <div className="form-group" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803d', fontWeight: '800' }}>
                <Clock size={18} color="#16a34a" /> Food Safe Collection Window (Hours : Minutes) *
              </label>
              <span style={{ fontSize: '0.78rem', background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: '700' }}>
                Max Safety Limit: {maxThresholdHours} hrs
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
              {/* Hours Input */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4b5563', display: 'block', marginBottom: '0.35rem' }}>
                  Hours (0 - {maxThresholdHours})
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    min="0" 
                    max={maxThresholdHours} 
                    step="1"
                    className="form-input" 
                    style={{ paddingRight: '3.5rem', fontWeight: '700', fontSize: '1.05rem', background: 'white' }} 
                    value={windowHours} 
                    onChange={(e) => setWindowHours(e.target.value)} 
                    placeholder="0"
                    required 
                  />
                  <span style={{ position: 'absolute', right: '1rem', color: '#6b7280', fontWeight: '700', fontSize: '0.85rem', pointerEvents: 'none' }}>
                    Hours
                  </span>
                </div>
              </div>

              {/* Minutes Input */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4b5563', display: 'block', marginBottom: '0.35rem' }}>
                  Minutes (0 - 59)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    min="0" 
                    max="59" 
                    step="1"
                    className="form-input" 
                    style={{ paddingRight: '3.5rem', fontWeight: '700', fontSize: '1.05rem', background: 'white' }} 
                    value={windowMinutes} 
                    onChange={(e) => setWindowMinutes(e.target.value)} 
                    placeholder="0"
                    required 
                  />
                  <span style={{ position: 'absolute', right: '1rem', color: '#6b7280', fontWeight: '700', fontSize: '0.85rem', pointerEvents: 'none' }}>
                    Mins
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280' }}>Quick Presets:</span>
              <button 
                type="button" 
                onClick={() => { setWindowHours('0'); setWindowMinutes('30'); }}
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: '600', borderRadius: '6px', border: '1px solid #d1d5db', background: (windowHours === '0' && windowMinutes === '30') ? '#16a34a' : 'white', color: (windowHours === '0' && windowMinutes === '30') ? 'white' : '#374151', cursor: 'pointer' }}
              >
                30 Mins
              </button>
              {maxThresholdHours >= 1 && (
                <button 
                  type="button" 
                  onClick={() => { setWindowHours('1'); setWindowMinutes('0'); }}
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: '600', borderRadius: '6px', border: '1px solid #d1d5db', background: (windowHours === '1' && windowMinutes === '0') ? '#16a34a' : 'white', color: (windowHours === '1' && windowMinutes === '0') ? 'white' : '#374151', cursor: 'pointer' }}
                >
                  1 Hour
                </button>
              )}
              {maxThresholdHours >= 2 && (
                <button 
                  type="button" 
                  onClick={() => { setWindowHours('2'); setWindowMinutes('0'); }}
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: '600', borderRadius: '6px', border: '1px solid #d1d5db', background: (windowHours === '2' && windowMinutes === '0') ? '#16a34a' : 'white', color: (windowHours === '2' && windowMinutes === '0') ? 'white' : '#374151', cursor: 'pointer' }}
                >
                  2 Hours
                </button>
              )}
              {maxThresholdHours >= 3 && (
                <button 
                  type="button" 
                  onClick={() => { setWindowHours('3'); setWindowMinutes('0'); }}
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: '600', borderRadius: '6px', border: '1px solid #d1d5db', background: (windowHours === '3' && windowMinutes === '0') ? '#16a34a' : 'white', color: (windowHours === '3' && windowMinutes === '0') ? 'white' : '#374151', cursor: 'pointer' }}
                >
                  3 Hours
                </button>
              )}
              {maxThresholdHours >= 4 && (
                <button 
                  type="button" 
                  onClick={() => { setWindowHours('4'); setWindowMinutes('0'); }}
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: '600', borderRadius: '6px', border: '1px solid #d1d5db', background: (windowHours === '4' && windowMinutes === '0') ? '#16a34a' : 'white', color: (windowHours === '4' && windowMinutes === '0') ? 'white' : '#374151', cursor: 'pointer' }}
                >
                  4 Hours
                </button>
              )}
              <button 
                type="button" 
                onClick={() => { setWindowHours(maxThresholdHours.toString()); setWindowMinutes('0'); }}
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: '700', borderRadius: '6px', border: '1px solid #16a34a', background: (windowHours === maxThresholdHours.toString() && windowMinutes === '0') ? '#16a34a' : '#f0fdf4', color: (windowHours === maxThresholdHours.toString() && windowMinutes === '0') ? 'white' : '#15803d', cursor: 'pointer' }}
              >
                Max Safe Limit ({maxThresholdHours}h)
              </button>
            </div>

            {/* Real-time Expiry & Duration Summary Badge */}
            <div style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#6b7280' }}>Selected Window: </span>
                <strong style={{ color: totalSafeHours > maxThresholdHours ? '#dc2626' : '#15803d' }}>
                  {parsedHours} hr{parsedHours !== 1 ? 's' : ''} {parsedMins} min{parsedMins !== 1 ? 's' : ''} ({totalSafeHours.toFixed(2)} hrs)
                </strong>
              </div>
              {getPreviewSafeUntil() && (
                <div style={{ color: '#1f2937' }}>
                  🛡️ <span style={{ color: '#6b7280' }}>Estimated Safe Until:</span> <strong>{getPreviewSafeUntil()}</strong>
                </div>
              )}
            </div>

            {totalSafeHours > maxThresholdHours && (
              <div style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: '700', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertTriangle size={14} /> Total collection window cannot exceed {maxThresholdHours} hours for {foodCategory}.
              </div>
            )}

            <span style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.5rem', display: 'block' }}>
              ℹ️ Standard safety regulation maximum threshold for <strong>{foodCategory}</strong> is <strong>{maxThresholdHours} hrs</strong>.
            </span>
          </div>

          {/* Interactive Map Location Selector */}
          <div className="form-group" style={{ marginTop: '1.25rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#16a34a', fontWeight: '800' }}>
                <MapPin size={16} color="#16a34a" /> Select Pickup Location on Map *
              </label>
              <button 
                type="button" 
                onClick={handleGetCurrentLocation} 
                disabled={locating}
                className="btn-secondary" 
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'white', opacity: locating ? 0.7 : 1, cursor: locating ? 'not-allowed' : 'pointer' }}
              >
                <Compass size={14} className={locating ? 'spin' : ''} /> {locating ? 'Detecting Location...' : 'Use My Current Location'}
              </button>
            </div>

            <Map 
              latitude={latitude ? parseFloat(latitude) : undefined} 
              longitude={longitude ? parseFloat(longitude) : undefined} 
              interactive={true} 
              onLocationSelect={handleMapLocationSelect} 
              height="320px" 
            />
            
            <div style={{ marginTop: '0.75rem', background: 'white', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem' }}>
              <div style={{ color: '#111827', fontWeight: '700', marginBottom: '0.2rem' }}>Pickup Coordinates:</div>
              {latitude && longitude ? (
                <div style={{ color: '#16a34a', fontWeight: '600' }}>
                  ✓ Latitude: <strong>{latitude}</strong> | Longitude: <strong>{longitude}</strong>
                </div>
              ) : (
                <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  Location not selected. Click on the map above to select your exact coordinates.
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Pickup Address *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                value={pickupAddress} 
                onChange={(e) => setPickupAddress(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLocateAddress(); } }}
                placeholder="Enter pickup street address / area / PIN code" 
                required 
              />
              <button
                type="button"
                onClick={handleLocateAddress}
                disabled={locating}
                className="btn-secondary"
                style={{ whiteSpace: 'nowrap', padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff' }}
              >
                <Search size={14} /> Locate Address
              </button>
            </div>
          </div>

          {/* Image Upload + Preview */}
          <div className="form-group">
            <label className="form-label">Food Image Upload (Optional)</label>
            <input type="file" accept="image/*" className="form-input" onChange={handleImageChange} />
            {imagePreview && (
              <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                <img src={imagePreview} alt="Preview" style={{ maxHeight: '180px', borderRadius: '12px', border: '1px solid #e5e7eb' }} />
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.85rem' }} disabled={loading}>
            {loading ? 'Publishing Listing...' : 'Submit Food Donation'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
