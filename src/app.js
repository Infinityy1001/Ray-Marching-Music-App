import * as THREE from 'three';
import vertex from './shaders/vertexShader.glsl';
import fragment from './shaders/fragmentShader.glsl';
import Button from './bouton';
import matcap from './assets/bubble.png';

export default class Sketch {
  constructor() {
    // Initialisation des éléments audio et de rendu
    this.audio = document.getElementById("audio");
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById("container").appendChild(this.renderer.domElement);

    // Configuration de la caméra
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 1000);
    this.camera.position.z = 1;

    let frustumSize = 1;
    this.camera = new THREE.OrthographicCamera(frustumSize / -2, frustumSize / 2, frustumSize / 2, frustumSize / -2, -1000, 1000);
    this.camera.position.set(0, 0, 2);

    // Boutons de contrôle
    this.playBtn = new Button('play-btn');
    this.playBtn.addClickListener(this.play.bind(this));

    this.stopBtn = new Button('stop-btn');
    this.stopBtn.addClickListener(this.stop.bind(this));

    this.micBtn = new Button('mic-btn');
    this.micBtn.addClickListener(this.toggleMicrophone.bind(this));

    // Initialisation de la scène, du temps et des dimensions
    this.scene = new THREE.Scene();
    this.time = 0;
    this.clock = 0.1;
    this.height = window.innerHeight;
    this.width = window.innerWidth;

    // Ajout des éléments à la scène
    this.addMesh();
    this.resize();
    this.render();
    this.mouseEvents();

    window.addEventListener('resize', this.resize.bind(this));

    // Configuration de l'audio et du microphone
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.microphone = null;
    this.isMicroActive = false;
  }

  // Basculer l'état du microphone
  toggleMicrophone() {
    if (this.isMicroActive) {
      this.stopMicrophone();
    } else {
      this.startMicrophone();
    }
  }

  // Démarrer l'enregistrement audio
  startMicrophone() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.microphone.connect(this.analyser);
        this.analyser.fftSize = 256;
        this.isMicroActive = true;
        this.micBtn.setText('🔴 Micro On');
      })
      .catch((err) => console.error("Erreur d'accès au micro", err));
  }

  // Arrêter l'enregistrement audio
  stopMicrophone() {
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    this.isMicroActive = false;
    this.micBtn.setText('🎤 Micro');
  }

  // Obtenir l'amplitude du son
  getAudioAmplitude() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    dataArray.forEach(value => sum += value);
    return sum / bufferLength;
  }

  // Arrêter la musique et réinitialiser
  stop() {
    this.material.uniforms.balls.value = 0;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.stopBtn.disable();
  }

  // Lire la musique et ajuster l'animation
  play() {
    this.material.uniforms.balls.value = 7;
    this.audio.load();
    this.audio.play();
    this.audio.addEventListener('ended', this.stop.bind(this));
    this.stopBtn.enable();

    // Changer la vitesse du temps à différents moments
    setTimeout(() => { this.clock = 0.15; }, 7000);
    setTimeout(() => { this.clock = 0.2; }, 9500);
    setTimeout(() => { this.clock = 0.1; }, 13000);
    setTimeout(() => { this.clock = 0.05; }, 20000);
    setTimeout(() => { this.clock = 0.15; }, 21000);
    setTimeout(() => { this.clock = 0.05; }, 23500);
    setTimeout(() => { this.clock = 0.15; }, 25000);
  }

  // Redimensionner le rendu lors du changement de taille de la fenêtre
  resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;

    this.imageAspect = 1;
    let a1, a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = (this.height / this.width) * this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;

    this.camera.updateProjectionMatrix();
  }

  // Événements de souris pour obtenir la position de la souris
  mouseEvents() {
    this.mouse = new THREE.Vector2();
    document.addEventListener('mousemove', (event) => {
      this.mouse.x = event.pageX / this.width - 0.5;
      this.mouse.y = -event.pageY / this.height + 0.5;
    })
  }

  // Ajouter un maillage à la scène
  addMesh() {
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.ShaderMaterial({
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms: {
        time: { type: "f", value: 0 },
        mouse: { value: new THREE.Vector2(0, 0) },
        matcap: { value: new THREE.TextureLoader().load(matcap) },
        resolution: { value: new THREE.Vector4() },
        balls: { value: 0 }
      }
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  // Fonction de rendu
  render() {
    this.time += this.clock;

    // Ajuster l'animation selon l'amplitude audio
    if (this.isMicroActive) {
      const amplitude = this.getAudioAmplitude();
      this.material.uniforms.balls.value = amplitude / 10;
    }

    this.mesh.material.uniforms.time.value = this.time;

    if (this.mouse) {
      this.mesh.material.uniforms.mouse.value = this.mouse;
    }

    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

// Initialisation du sketch
new Sketch();
