import sys
import json
import math

# ==================================================
# SMARTSURPLUS PYTHON AI MATCHING SERVICE & ML MODEL
# ==================================================
# Weights
DISTANCE_WEIGHT = 0.25
CAPACITY_WEIGHT = 0.20
URGENCY_WEIGHT = 0.25
AVAILABILITY_WEIGHT = 0.15
RESPONSE_WEIGHT = 0.15

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * Math_atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def Math_atan2(y, x):
    return math.atan2(y, x)

def get_distance_score(dist_km):
    if dist_km <= 2:
        return 100
    elif dist_km <= 5:
        return 80
    elif dist_km <= 10:
        return 60
    elif dist_km <= 20:
        return 40
    elif dist_km <= 30:
        return 20
    return 0

def predict_best_ngo(donation, ngos):
    donor_lat = float(donation.get('latitude', 13.0067))
    donor_lng = float(donation.get('longitude', 80.2206))
    donation_qty = float(donation.get('quantity', 10))
    safe_until = donation.get('safe_until')

    scored_ngos = []

    for ngo in ngos:
        if not ngo.get('is_verified') or not ngo.get('is_available'):
            continue

        try:
            ngo_lat = float(ngo.get('latitude'))
            ngo_lng = float(ngo.get('longitude'))
            ngo_capacity = float(ngo.get('food_capacity', 0))
        except (ValueError, TypeError):
            continue

        if ngo_capacity < donation_qty:
            continue

        # Haversine distance
        dist_km = calculate_haversine_distance(donor_lat, donor_lng, ngo_lat, ngo_lng)
        dist_score = get_distance_score(dist_km)

        # Capacity score
        cap_ratio = ngo_capacity / donation_qty
        cap_score = min(100, round(100 if cap_ratio >= 2 else cap_ratio * 50))

        # Urgency & Response score
        urgency_score = 75
        availability_score = 100
        response_score = float(ngo.get('response_rate', 90.0))

        # ML Model Weighted Scoring Function
        total_score = round(
            (dist_score * DISTANCE_WEIGHT) +
            (cap_score * CAPACITY_WEIGHT) +
            (urgency_score * URGENCY_WEIGHT) +
            (availability_score * AVAILABILITY_WEIGHT) +
            (response_score * RESPONSE_WEIGHT)
        )

        explanation = [
            f"✓ {dist_km} km distance calculated via Python AI Model",
            f"✓ Sufficient capacity ({ngo_capacity} meals)",
            f"✓ Active availability status",
            f"✓ Response history score ({response_score}%)"
        ]

        scored_ngos.append({
            'ngo': ngo,
            'totalScore': total_score,
            'distanceKm': dist_km,
            'breakdown': {
                'distanceScore': dist_score,
                'capacityScore': cap_score,
                'urgencyScore': urgency_score,
                'availabilityScore': availability_score,
                'responseScore': response_score
            },
            'explanation': explanation
        })

    if not scored_ngos:
        return {'success': False, 'message': 'No suitable NGO found by Python AI model.'}

    # Sort descending by AI score
    scored_ngos.sort(key=lambda x: x['totalScore'], reverse=True)
    best_match = scored_ngos[0]

    return {
        'success': True,
        'engine': 'Python AI Matching Service / ML Model',
        'match': {
            'donationId': donation.get('id'),
            'bestNGO': best_match['ngo'],
            'score': best_match['totalScore'],
            'distance': best_match['distanceKm'],
            'capacityScore': best_match['breakdown']['capacityScore'],
            'urgencyScore': best_match['breakdown']['urgencyScore'],
            'availabilityScore': best_match['breakdown']['availabilityScore'],
            'responseScore': best_match['breakdown']['responseScore'],
            'explanation': best_match['explanation']
        },
        'allCandidates': [
            {'id': item['ngo']['id'], 'name': item['ngo'].get('organization_name'), 'score': item['totalScore'], 'distanceKm': item['distanceKm']}
            for item in scored_ngos
        ]
    }

def main():
    if len(sys.argv) < 2:
        # Read from stdin if no file passed
        raw_input = sys.stdin.read()
    else:
        with open(sys.argv[1], 'r') as f:
            raw_input = f.read()

    try:
        data = json.loads(raw_input)
        donation = data.get('donation', {})
        ngos = data.get('ngos', [])
        result = predict_best_ngo(donation, ngos)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

if __name__ == '__main__':
    main()
