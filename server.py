import os
from flask import request, render_template, abort, jsonify
import uuid
import geopy.distance
from deep_translator import GoogleTranslator
from flask import Flask, request, render_template, send_from_directory, redirect
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

app = Flask(__name__)

load_dotenv()


def translate_text(text, target_language):
    translated = GoogleTranslator(
        source='auto', target=target_language).translate(text)
    return translated


def get_database_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error connecting to MySQL database: {e}")
        return None


# Function to build HAVERSINE formula snippet for MySQL
# Assuming input coordinates are in decimal degrees
def init():
    db = get_database_connection()
    cur = db.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS labour_details (
        labour_id CHAR(32) NOT NULL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        status INT NOT NULL DEFAULT 0,
        points INT NOT NULL DEFAULT 0,
        area VARCHAR(255) NOT NULL,
        city VARCHAR(150) NOT NULL,
        location_coords VARCHAR(150) NOT NULL,
        skills JSON NOT NULL,
        phone1 VARCHAR(15) NOT NULL UNIQUE,
        phone2 VARCHAR(15) NULL,
        email VARCHAR(150) NULL UNIQUE,
        languages_spoken TEXT NULL,
        experience_years INT NULL DEFAULT 0,
        rating FLOAT NULL DEFAULT 0,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    """)
    db.commit()
    cur.close()
    db.close()


init()


def haversine_formula(lat1, lng1):
    # This SQL snippet assumes location_coords stored as 'latitude,longitude'
    return f"""(
        6371 * acos(
            cos(radians({lat1})) * cos(radians(CAST(SUBSTRING_INDEX(location_coords, ',', 1) AS DECIMAL(10,6)))) *
            cos(radians(CAST(SUBSTRING_INDEX(location_coords, ',', -1) AS DECIMAL(10,6))) - radians({lng1})) +
            sin(radians({lat1})) * sin(radians(CAST(SUBSTRING_INDEX(location_coords, ',', 1) AS DECIMAL(10,6))))
        )
    )"""


@app.route("/")
@app.route("/")
def index():
    return redirect("/en/")


lang_supported = [
    'en',   # English
    'hi',   # Hindi
    'bn',   # Bengali
    'te',   # Telugu
    'ta',   # Tamil
    'ur',   # Urdu
    'gu',   # Gujarati
    'kn',   # Kannada
    'pa',   # Punjabi
    'mr',   # Marathi
]


@app.route('/<lang>/<int:page>')
def home(lang, page=1):
    if lang not in lang_supported:
        abort(404, description="Language not found")
    PER_PAGE = 20

    db = get_database_connection()
    laborers = []
    total_labors = 0

    if db:
        cur = db.cursor(dictionary=True)
        rating = request.args.get('rating', '').strip()
        city_filter = request.args.get('city', '').strip()
        category_filter = request.args.get('category', '').strip()

        # Sample user location (use real geolocation in production)
        user_location = (22.7100, 75.8577)

        base_sql = "SELECT * FROM labours WHERE 1=1"
        count_sql = "SELECT COUNT(*) as total FROM labours WHERE 1=1"

        base_params = []
        count_params = []

        # Process search query
        search_query = request.args.get('q', '').strip()
        if search_query:
            search_terms = [term.strip()
                            for term in search_query.split(',') if term.strip()]
            if search_terms:
                search_clauses = []
                for _ in search_terms:
                    search_clauses.append(
                        "(name LIKE %s OR city LIKE %s OR CAST(skills AS CHAR) LIKE %s)")
                search_condition = " AND (" + " OR ".join(search_clauses) + ")"
                base_sql += search_condition
                count_sql += search_condition

                for term in search_terms:
                    pattern = f"%{term}%"
                    base_params.extend([pattern, pattern, pattern])
                    count_params.extend([pattern, pattern, pattern])
        skill = request.args.get('skill', '').lower()
        skill_level = request.args.get('skill_level', '0')
        if skill and skill_level.isdigit():
            print('jees')
            base_sql += " AND CAST(JSON_EXTRACT(skills, %s) AS UNSIGNED) >= %s"
            count_sql += " AND CAST(JSON_EXTRACT(skills, %s) AS UNSIGNED) >= %s"
            count_params.extend([f'$.{skill}', int(skill_level)])
            base_params.extend([f'$.{skill}', int(skill_level)])

        # City filter
        if city_filter:
            condition = " AND city = %s"
            base_sql += condition
            count_sql += condition
            base_params.append(city_filter)
            count_params.append(city_filter)

        # Category filter inside skills JSON (JSON_CONTAINS expects JSON input)
        if category_filter:
            condition = " AND JSON_CONTAINS(skills, %s)"
            base_sql += condition
            count_sql += condition
            # Wrap category_filter in double quotes for JSON string matching
            base_params.append(f'"{category_filter}"')
            count_params.append(f'"{category_filter}"')

        # Rating filter
        if rating:
            try:
                rating_val = float(rating)
                condition = " AND rating >= %s"
                base_sql += condition
                count_sql += condition
                base_params.append(rating_val)
                count_params.append(rating_val)
            except ValueError:
                pass  # Ignore invalid rating inputs

        # Get total count with count_params
        cur.execute(count_sql, count_params)
        total_result = cur.fetchone()
        total_labors = total_result['total'] if total_result else 0

        # Add pagination to base query
        base_sql += " LIMIT %s OFFSET %s"
        base_params.extend([PER_PAGE, (page - 1) * PER_PAGE])

        cur.execute(base_sql, base_params)
        laborers = cur.fetchall()
        distance_filter = request.args.get('distance', '').strip()

        filtered_laborers = []
        user_lat, user_lng = user_location

        # Convert distance_filter safely to float (None if invalid)
        try:
            max_distance = float(distance_filter) if distance_filter else None
        except ValueError:
            max_distance = None

        for labour in laborers:
            loc = labour.get('location_coords', '')
            try:
                lat_str, lng_str = loc.split(',')
                labour_location = (float(lat_str), float(lng_str))
                dist_km = geopy.distance.distance(
                    user_location, labour_location).km
                labour['distance_km'] = round(dist_km, 2)
            except (ValueError, AttributeError):
                labour['distance_km'] = None
                dist_km = None

            # Filter if max_distance provided and calculated
            if max_distance is None or (dist_km is not None and dist_km <= max_distance):
                filtered_laborers.append(labour)

        laborers = filtered_laborers
        total_labors = len(laborers)
        if lang != "en":
            for labour in laborers:
                if labour.get('name'):
                    labour['name'] = translate_text(labour['name'], lang)
                if labour.get('city'):
                    labour['city'] = translate_text(labour['city'], lang)
                if labour.get('area'):
                    labour['area'] = translate_text(labour['area'], lang)

                # Translate skill names inside the skills dict
                if labour.get('skills') and isinstance(labour['skills'], dict):
                    translated_skills = {}
                    for skill_name, skill_level in labour['skills'].items():
                        translated_name = translate_text(skill_name, lang)
                        translated_skills[translated_name] = skill_level
                    labour['skills'] = translated_skills

                    cur.close()
                    db.close()

    return render_template('index.html', title='Labour Connect - Home', laborers=laborers, total=total_labors, lang=lang, page=page)

# Optional: route to default page 1 if page param not provided


@app.route('/<lang>/')
def home_default(lang):
    return home(lang, page=1)


@app.route('/styles/<path:filename>')
def styles(filename):
    return send_from_directory('styles', filename)


@app.route('/js/<path:filename>')
def js(filename):
    return send_from_directory('js', filename)


@app.route("/about/")
def about():
    return render_template('about.html')


@app.route("/support/")
def support():
    return render_template('support.html')


@app.route('/add_labour', methods=['POST'])
def add_labour():
    data = request.json
    if not data:
        return jsonify({'error': 'Missing JSON body'}), 400
    if request.headers.get('authorization') and request.headers.get('authorization') == os.getenv('ADMIN_PASSWORD'):

        # Required fields check
        required_fields = ['name', 'status', 'points',
                           'area', 'city', 'location_coords', 'skills', 'phone1']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        data['labour_id'] = str(uuid.uuid4()).replace('-', '')[:32]

        try:
            db = get_database_connection()
            cur = db.cursor()
            sql = """
                INSERT INTO labour_details (
                    labour_id, name, status, points, area, city, location_coords, skills,
                    phone1, phone2, email, languages_spoken, experience_years, rating
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cur.execute(sql, (
                data['labour_id'],
                data['name'],
                data['status'],
                data['points'],
                data['area'],
                data['city'],
                data['location_coords'],
                # should be a JSON string or Python dict (converted automatically)
                data['skills'],
                data['phone1'],
                data.get('phone2'),
                data.get('email'),
                data.get('languages_spoken'),
                data.get('experience_years', 0),
                data.get('rating', 0),
            ))
            db.commit()
            cur.close()
            db.close()
            return jsonify({'message': 'Labour added successfully', 'labour_id': data['labour_id']}), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'message': 'You are not authorized to add new labour'}), 401


@app.route('/get_labours', methods=['GET'])
def get_labours():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header missing'}), 401

    expected_password = os.environ.get('ADMIN_PASSWORD')
    if not expected_password or auth_header != expected_password:
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        db = get_database_connection()
        cur = db.cursor(dictionary=True)
        cur.execute("SELECT * FROM labour_details")
        labours = cur.fetchall()
        cur.close()
        db.close()
        return jsonify({'labours': labours}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/update_labour/<labour_id>', methods=['PUT'])
def update_labour(labour_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header missing'}), 401

    expected_password = os.environ.get('ADMIN_PASSWORD')
    if not expected_password or auth_header != expected_password:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.json
    if not data:
        return jsonify({'error': 'Missing JSON body'}), 400

    allowed_fields = ['name', 'status', 'points', 'area', 'city', 'location_coords', 'skills',
                      'phone1', 'phone2', 'email', 'languages_spoken', 'experience_years', 'rating']

    update_fields = []
    update_values = []

    for key in allowed_fields:
        if key in data:
            update_fields.append(f"{key} = %s")
            update_values.append(data[key])

    if not update_fields:
        return jsonify({'error': 'No valid fields to update'}), 400

    update_values.append(labour_id)

    sql = f"UPDATE labour_details SET {', '.join(update_fields)} WHERE labour_id = %s"

    try:
        db = get_database_connection()
        cur = db.cursor()
        cur.execute(sql, tuple(update_values))
        db.commit()
        rows_affected = cur.rowcount
        cur.close()
        db.close()

        if rows_affected == 0:
            return jsonify({'error': 'Labour not found'}), 404

        return jsonify({'message': 'Labour updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
