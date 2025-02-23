from flask import Flask, render_template, request, jsonify
from supabase import create_client
import os
import base64
import datetime

app = Flask(__name__)

# Supabase Configuration
SUPABASE_URL = "https://ydoxecqsmrcdzohiwaxn.supabase.co"  # Replace with your Supabase project URL
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkb3hlY3FzbXJjZHpvaGl3YXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMDYzNTEsImV4cCI6MjA1NTg4MjM1MX0.rl-PLrpiJ39YkcfQCHn2tlUGOuIkADbN06lfHFw37zM"  # Replace with your Supabase API key
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Home route displaying available drawings
@app.route('/')
def home():
    drawings = ['star', 'circle', 'square', 'heart']  # Example drawing options
    return render_template('index.html', drawings=drawings)

# Tracing route
@app.route('/trace/<shape>')
def trace(shape):
    return render_template('trace.html', shape=shape)

# Score evaluation (Placeholder for actual logic)
@app.route('/score', methods=['POST'])
def score():
    data = request.get_json()
    user_score = data.get('accuracy', 0)  # Dummy accuracy value from frontend
    return jsonify({'message': 'Tracing evaluated!', 'score': user_score})

# Community Feedback Page
@app.route('/community_drawing')
def community_drawing():
    return render_template('community_drawing.html')

# Community Feedback Page
@app.route('/community_draw')
def community_draw():
    return render_template('community_draw.html')


# Community Feedback Page
@app.route('/community_feedback')
def community_feedback():
    # Fetch feedbacks from Supabase
    response = supabase.table('feedbacks').select("*").execute()
    feedbacks = response.data if response.data else []
    return render_template('community_feedback.html', feedbacks=feedbacks)

# Handle feedback submission
@app.route('/submit-feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    name = data.get('name', 'Anonymous')
    feedback = data.get('feedback', '')

    if not feedback:
        return jsonify({'status': 'error', 'message': 'Feedback cannot be empty!'}), 400

    # Insert into Supabase
    response = supabase.table('feedbacks').insert({"name": name, "feedback": feedback}).execute()
    
    if response.data:
        return jsonify({'status': 'success', 'message': 'Feedback submitted!', 'feedback': response.data})
    else:
        return jsonify({'status': 'error', 'message': 'Failed to submit feedback'}), 500

# ===================== Community Drawing Feature =====================
# Upload drawing to Supabase Storage & save URL in DB
@app.route('/upload_drawing', methods=['POST'])
def upload_drawing():
    try:
        data = request.get_json()
        image_data = data.get('image')  # Base64 image from frontend
        username = data.get('username', 'Anonymous')

        if not image_data:
            return jsonify({'status': 'error', 'message': 'No image data provided!'}), 400

        # Decode Base64 image
        image_binary = base64.b64decode(image_data.split(",")[1])
        file_name = f"drawing_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.png"

        # Upload to Supabase Storage (Removing content_type)
        storage_response = supabase.storage.from_("drawings").upload(file_name, image_binary)

        if not storage_response:
            return jsonify({'status': 'error', 'message': 'Failed to upload image'}), 500

        # Get the public URL of the image
        image_url = f"{SUPABASE_URL}/storage/v1/object/public/drawings/{file_name}"

        # Save URL to Supabase database
        db_response = supabase.table('drawings').insert({"username": username, "image_url": image_url}).execute()

        if db_response.data:
            return jsonify({'status': 'success', 'message': 'Drawing uploaded!', 'image_url': image_url})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to save image URL'}), 500

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# Fetch shared drawings from Supabase
@app.route('/get_drawings', methods=['GET'])
def get_drawings():
    try:
        response = supabase.table('drawings').select("username, image_url").order("id", desc=True).execute()
        drawings = response.data if response.data else []
        return jsonify({'status': 'success', 'drawings': drawings})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
