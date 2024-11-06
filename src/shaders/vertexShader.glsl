// Variable pour passer les coordonnées de texture au fragment shader
varying vec2 vUv;

void main() {
  // Assigner les coordonnées de texture à la variable varying
  vUv = uv;
  
  // Calculer la position du vertex dans l'espace de la caméra (model-view matrix)
  vec4 mvPosition = modelViewMatrix * vec4( position, 1. );
  
  // Calculer la position finale du vertex dans l'espace de projection (projection matrix)
  gl_Position = projectionMatrix * mvPosition;
}
