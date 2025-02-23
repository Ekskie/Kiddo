from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(debug=True)
