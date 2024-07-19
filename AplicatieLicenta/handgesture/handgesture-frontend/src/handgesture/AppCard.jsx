import React, { useRef, useEffect, useState } from 'react';
import { Grid, Card, CardContent, Switch, Typography, Slider, TextField, Button, Paper, Snackbar, Alert } from '@mui/material';

import SendIcon from '@mui/icons-material/Send';

import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

import "../css/handgesture.css"
import "../css/ChatMessage.css"

function AppCard() {
    // Constants and refs for managing camera, MediaPipe Hands and canvas for drawing hands
    const cameraWidth = 600;
    const cameraHeight = 400;

    const handsRef = useRef(null);

    const cameraRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Constants for managing prediction interval
    const predictionFrameInterval = useRef(15);
    const predictionCurrentFrame = useRef(0);

    // State variables for translation and chat messages
    const letters = [];
    const [translated, setTranslated] = useState(['']);
    const [currentLetter, setCurrentLetter] = useState('');

    const lenghtTranslatedRef = useRef(0);

    const [userMessage, setUserMessage] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const containerRef = useRef(null);

    // State variable for showing or hiding the Snackbar component.
    const [showSnackbar, setShowSnackbar] = useState(false);

    // State variable for storing the message to display in the Snackbar.
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // State variable indicating whether the Snackbar should display success or error severity.
    const [isSuccessSnackbar, setIsSuccessSnackbar] = useState(false);

    /**
     * Initialize Hands and Camera when component mounts.
     */
    useEffect(() => {
        setupHands();
        setupCamera();
    }, []);

    /**
     * Sets up the Hands object for hand tracking.
     */
    const setupHands = async () => {
        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        hands.onResults(onResults);

        handsRef.current = hands;
    }

    /**
     * Sets up the Camera object for video capture.
     */
    const setupCamera = async () => {
        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                await handsRef.current.send({ image: videoRef.current });
            },
            width: cameraWidth,
            height: cameraHeight
        });

        cameraRef.current = camera;
    }

    const startCamera = () => {
        if (cameraRef.current) {
            cameraRef.current.start();
        }
    }

    const stopCamera = () => {
        if (cameraRef.current) {
            cameraRef.current.stop();
        }
    }

    /**
     * Starts the camera feed when the Switch is toggled.
     */
    const handleSwitchChange = (event) => {
        if (event.target.checked) {
            startCamera();
        } else {
            stopCamera();
        }
    };

    /**
     * Draws the hand landmarks and connections for every camera frame.
     */
    const onResults = (results) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                drawLandmarks(ctx, landmarks);
                drawConnections(ctx, landmarks);
            }

            if (predictionCurrentFrame.current === predictionFrameInterval.current) {
                predictLetter(results.multiHandLandmarks[0]);
                predictionCurrentFrame.current = 0;
            } else {
                predictionCurrentFrame.current++;
            }
        }
    };

    /**
     * Draws landmarks on the canvas for visual representation.
     */
    const drawLandmarks = (ctx, landmarks) => {
        for (const landmark of landmarks) {
            const x = landmark.x * ctx.canvas.width;
            const y = landmark.y * ctx.canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'green';
            ctx.fill();
        }
    };

    /**
     * Draws connections between landmarks on the canvas.
     */
    const drawConnections = (ctx, landmarks) => {
        const HAND_CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
            [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
        ];

        for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
            const startX = landmarks[startIdx].x * ctx.canvas.width;
            const startY = landmarks[startIdx].y * ctx.canvas.height;
            const endX = landmarks[endIdx].x * ctx.canvas.width;
            const endY = landmarks[endIdx].y * ctx.canvas.height;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    };

    /**
     * Predicts the letter based on camera frame.
     */
    const predictLetter = async (landmarks) => {
        // Sends image to prediction sever only if the hand is detected
        if (landmarks) {
            const [minX, minY, maxX, maxY] = getBoundingBox(landmarks);
            const width = maxX - minX;
            const height = maxY - minY;

            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, minX, minY, width, height, 0, 0, width, height);
            const image = canvas.toDataURL('image/png');

            const response = await fetch('http://127.0.0.1:8000/predict_letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image })
            }).then((response) => {
                return response.json();
            }).then((data) => {
                if (data.errorMessage) {
                    throw new Error(data.errorMessage);
                } else {
                    setCurrentLetter(data.predicted_letter);
                    letters.push(data.predicted_letter);
                }
            }).catch(error => {
                setSnackbarMessage("The prediction server is currently unavailable.");

                setShowSnackbar(true);
            });
        // no hand detected means "space"
        } else if (lenghtTranslatedRef.current > 0) {
            setCurrentLetter(' ');
            letters.push('\u00A0');
        }

        // verify if the last 4 letters predicted are the same (the sign is the same in front of camera for the chosen time interval)
        // if true means the letter will be part of final translate
        if (letters.length >= 4) {
            const lastThreeLetters = letters.slice(-4);
            if (lastThreeLetters.every(l => l === lastThreeLetters[0])) {
                setTranslated(prev => {
                    const newTranslation = [...prev, lastThreeLetters[0]];

                    const lastThreeChars = newTranslation.slice(-3);
                    if (lastThreeChars.every(char => char === '\u00A0')) {
                        const lastMessage = newTranslation.join('');
                        setChatMessages(prev => [...prev, { text: lastMessage.trim(), sender: 'system' }]);
                        lenghtTranslatedRef.current = 0;
                        return [''];
                    }

                    lenghtTranslatedRef.current = newTranslation.length;

                    return newTranslation;
                });
                letters.length = 0;
            } else {
                letters.splice(0, letters.length - 4);
            }
        }
    };

    /**
     * Calculates the bounding box around hand landmarks in order to send an image containing only the hand to server, not additional elements.
     */
    const getBoundingBox = (landmarks) => {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const landmark of landmarks) {
            const x = landmark.x * cameraWidth;
            const y = landmark.y * cameraHeight;

            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        let width = maxX - minX;
        let height = maxY - minY;

        const aspectRatio = cameraWidth / cameraHeight;

        if (width / height > aspectRatio) {
            const newHeight = width / aspectRatio;
            const centerY = (minY + maxY) / 2;
            minY = Math.max(0, centerY - newHeight / 2);
            maxY = Math.min(cameraHeight, centerY + newHeight / 2);
        } else {
            const newWidth = height * aspectRatio;
            const centerX = (minX + maxX) / 2;
            minX = Math.max(0, centerX - newWidth / 2);
            maxX = Math.min(cameraWidth, centerX + newWidth / 2);
        }

        const padding = 20;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(cameraWidth, maxX + padding);
        maxY = Math.min(cameraHeight, maxY + padding);

        return [minX, minY, maxX, maxY];
    };

    /**
     * Handles the change event of the translation speed slider.
     */
    const handleSliderChange = (event, newValue) => {
        const newFrameInterval = Math.round(50 - (newValue / 100) * 45);
        predictionCurrentFrame.current = 0;
        predictionFrameInterval.current = newFrameInterval;
    };

    /**
     * Handles user message input.
     */
    const handleUserMessageChange = (event) => {
        setUserMessage(event.target.value);
    };

    /**
     * Handles sending user message in the chat.
     */
    const handleSendMessage = () => {
        if (userMessage.trim() !== '') {
            setChatMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
            setUserMessage('');
        }
    };

    /**
     * Handles Enter key for sending message.
     */
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };

    /**
     * Scroll chat container to the bottom on chat message added.
     */
    useEffect(() => {
        const container = containerRef.current;
        container.scrollTop = container.scrollHeight;
    }, [chatMessages]);

    /*
     * Handle the Snackbar close event.
     */
    const handleSnackbarClose = () => {
        setShowSnackbar(false);
    };

    return (
        <Grid container justifyContent="center" alignItems="center">
            <Grid item xs={12} md={10} lg={10} xl={10} style={{ marginTop: 25 }}>
                <Card>
                    <CardContent>
                        <Grid container gap="15px" style={{ marginTop: 15 }}>
                            {/* setting section */}
                            <Grid item container alignItems='center' justifyContent='space-between'>
                                {/* start and stop camera */}
                                <Grid item container style={{ width: 'fit-content' }} alignItems='center'>
                                    <Grid item>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Camera</Typography>
                                    </Grid>
                                    <Grid item>
                                        <Switch onChange={handleSwitchChange} color="warning" />
                                    </Grid>
                                </Grid>

                                {/* set translation speed on slider */}
                                <Grid item container style={{ width: '30%' }} alignItems='center' gap='25px'>
                                    <Grid item>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Translation speed</Typography>
                                    </Grid>
                                    <Grid item style={{ width: '50%', minWidth: '80px' }}>
                                        <Slider
                                            color="warning"
                                            min={1}
                                            defaultValue={78}
                                            aria-label="Default"
                                            valueLabelDisplay="auto"
                                            onChange={handleSliderChange} />
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* camera section */}
                            <Grid item container justifyContent='center' gap='25px'>
                                {/* displaying camera feed and drawing hand landmarks and connections */}
                                <Grid item width={'600px'} style={{
                                    maxHeight: cameraHeight,
                                    height: 'auto',
                                    position: 'relative',
                                }}>
                                    <video
                                        ref={videoRef}
                                        style={{
                                            width: "100%",
                                            height: 'auto',
                                            maxWidth: cameraWidth,
                                            maxHeight: cameraHeight,
                                            position: 'absolute',
                                            transform: 'scaleX(-1)'
                                        }}>
                                    </video>

                                    <canvas
                                        ref={canvasRef}
                                        width={cameraWidth}
                                        height={cameraHeight}
                                        style={{
                                            width: "100%",
                                            height: 'auto',
                                            maxWidth: cameraWidth,
                                            maxHeight: cameraHeight,
                                            position: 'relative',
                                            transform: 'scaleX(-1)'
                                        }}>
                                    </canvas>
                                </Grid>

                                {/* displaying signs image */}
                                <Grid item>
                                    <img
                                        src="/img/allSigns2.jpg"
                                        alt="signs"
                                        style={{
                                            maxWidth: cameraWidth,
                                            maxHeight: cameraHeight,
                                            width: '100%',
                                            height: "auto",
                                            marginRight: "1rem",
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            {/* displaying translated text and current letter */}
                            <Grid item container alignItems='center'>
                                <Grid item>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Translation:&nbsp;</Typography>
                                </Grid>
                                <Grid item>
                                    <Typography variant="subtitle1">{translated.join('')}</Typography>
                                </Grid>
                                <Grid item>
                                    <Typography
                                        variant="subtitle1"
                                        style={{ color: 'grey' }}>
                                        {currentLetter}
                                        <span className="blinking-cursor">|</span>
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* chat messages */}
                            <Paper style={{ padding: '10px', backgroundColor: '#f5f5f5', width: '100%' }}>
                                <Grid container direction="row" gap='25px'>
                                    {/* displaying chat messages */}
                                    <Grid item container direction="row" gap="10px" className="custom-scrollbar" style={{ maxHeight: '150px', overflowX: 'auto' }} ref={containerRef}>
                                        {chatMessages.map((msg, index) => (
                                            <Grid item container key={index} justifyContent={msg.sender === 'user' ? 'flex-end' : 'flex-start'}>
                                                <Paper style={{
                                                    padding: '5px',
                                                    backgroundColor: msg.sender === 'user' ? '#D3D3D3' : '#C0C0C0',
                                                    marginLeft: msg.sender === 'user' ? '10px' : '0',
                                                    marginRight: msg.sender === 'system' ? '0' : '10px',
                                                }}>
                                                    <Typography>{msg.text}</Typography>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {/* input field and send button */}
                                    <Grid item container gap="10px" direction="row" alignItems='center'>
                                        <Grid item xs>
                                            <TextField
                                                label="Type message"
                                                variant="outlined"
                                                color='warning'
                                                value={userMessage}
                                                onChange={handleUserMessageChange}
                                                fullWidth
                                                onKeyDown={handleKeyDown}
                                            />
                                        </Grid>
                                        <Grid item>
                                            <Button color="warning" onClick={handleSendMessage} disabled={userMessage.trim() === ''}>
                                                <SendIcon variant="outlined" fontSize='large' />
                                            </Button>
                                        </Grid>
                                    </Grid>

                                    {/* Conditionally render the Snackbar for showing success or error messages */}
                                    {showSnackbar &&
                                        <Grid item>
                                            <Snackbar
                                                open={showSnackbar}
                                                autoHideDuration={5000}
                                                onClose={handleSnackbarClose}
                                                anchorOrigin={{
                                                    vertical: "bottom",
                                                    horizontal: "center"
                                                }}
                                            >
                                                <Alert
                                                    elevation={6}
                                                    variant="filled"
                                                    onClose={handleSnackbarClose}
                                                    severity={isSuccessSnackbar ? 'success' : 'error'}
                                                >
                                                    {snackbarMessage}
                                                </Alert>
                                            </Snackbar>
                                        </Grid>}
                                </Grid>
                            </Paper>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}

export default AppCard;
