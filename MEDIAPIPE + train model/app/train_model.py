import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator

model = models.Sequential([
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(200, 200, 3)),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(128, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    layers.Flatten(),
    layers.Dense(128, activation='relu'),
    layers.Dense(26, activation='softmax')
])

model.compile(optimizer='adam',
              loss='categorical_crossentropy',
              metrics=['accuracy'])

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=10,
    width_shift_range=0.3,
    height_shift_range=0.2,
    zoom_range=0.3,
    fill_mode='nearest')

train_generator = train_datagen.flow_from_directory(
        'MediaPipeImages',
        target_size=(200, 200),
        batch_size=32,
        class_mode='categorical')

model.fit(
      train_generator,
      steps_per_epoch=100,
      epochs=30)

# Salvarea modelului antrenat
model.save('asl_recognition_augmentation_30epochs_10_0.3_0.2_0.3.keras')
