from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import cv2
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import tensorflow as tf
import base64
import mediapipe as mp

app = Flask(__name__)
CORS(app, origins='http://localhost:8080')

model = load_model('asl_recognition_augmentation_30epochs_9_0.35_0.15_0.35.keras')

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.5)


@app.route('/predict_letter', methods=['POST', 'OPTIONS'])
@cross_origin(origin='http://localhost:8080', headers=['Content-Type', 'Authorization'])
def predict_from_frame():
    try:
        data = request.json
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400

        image_data = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        np_img = np.frombuffer(image_bytes, dtype=np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        frame_flipped = cv2.flip(frame, 1)
        frame_resized = cv2.resize(frame_flipped, (200, 200))
        image_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)

        # cv2.imwrite('generated_image_react_test.jpg', image_rgb)

        results = hands.process(image_rgb)

        if results.multi_hand_landmarks:
            new_image = 255 * np.ones(shape=[frame_resized.shape[0], frame_resized.shape[1], 3], dtype=np.uint8)
            for hand_landmarks in results.multi_hand_landmarks:
                for landmark in hand_landmarks.landmark:
                    x = int(landmark.x * frame_resized.shape[1])
                    y = int(landmark.y * frame_resized.shape[0])
                    cv2.circle(new_image, (x, y), 5, (0, 255, 0), -1)

                    x = int(landmark.x * frame.shape[1])
                    y = int(landmark.y * frame.shape[0])
                    cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)
                connections = mp_hands.HAND_CONNECTIONS
            for connection in connections:
                x0, y0 = int(hand_landmarks.landmark[connection[0]].x * frame_resized.shape[1]), int(
                    hand_landmarks.landmark[connection[0]].y * frame_resized.shape[0])
                x1, y1 = int(hand_landmarks.landmark[connection[1]].x * frame_resized.shape[1]), int(
                    hand_landmarks.landmark[connection[1]].y * frame_resized.shape[0])
                cv2.line(new_image, (x0, y0), (x1, y1), (255, 0, 0), 2)

                x0, y0 = int(hand_landmarks.landmark[connection[0]].x * frame.shape[1]), int(
                    hand_landmarks.landmark[connection[0]].y * frame.shape[0])
                x1, y1 = int(hand_landmarks.landmark[connection[1]].x * frame.shape[1]), int(
                    hand_landmarks.landmark[connection[1]].y * frame.shape[0])
                cv2.line(frame, (x0, y0), (x1, y1), (255, 0, 0), 2)

            cv2.imwrite('generated_image_react.jpg', new_image)

        img = image.load_img('generated_image_react.jpg')
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)

        img_array /= 255.0
        predictions = model(img_array)

        predictions_np = predictions.numpy()
        predicted_class_index = np.argmax(predictions_np)
        predicted_letter = chr(ord('A') + predicted_class_index)

        if (predicted_letter == 'E' or predicted_letter == 'I') and predictions_np[0][predicted_class_index] < 0.8:
            predicted_letter = 'S'
        elif predicted_letter == 'H' and predictions_np[0][predicted_class_index] < 0.85:
            predicted_letter = 'G'
        elif predicted_letter == 'N' and predictions_np[0][predicted_class_index] < 0.95:
            predicted_letter = 'M'
        elif predicted_letter == 'K' and predictions_np[0][predicted_class_index] < 0.7:
            predicted_letter = 'V'
        elif predicted_letter == 'A' and predictions_np[0][predicted_class_index] < 0.9:
            predicted_letter = 'X'

        response_data = {
            'predicted_letter': predicted_letter
        }

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)
