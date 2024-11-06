// Uniformes pour les paramètres d'entrée
uniform float time;
uniform float progress;
uniform vec2 mouse;
uniform float balls;
uniform sampler2D matcap;
uniform vec4 resolution;
varying vec2 vUv;

float PI = 3.1459;

// Calcule les coordonnées UV pour échantillonner la texture MatCap
vec2 getmatcap(vec3 eye, vec3 normal) {
    vec3 reflected = reflect(eye, normal);
    float m = 2.8284 * sqrt(reflected.z + 1.0);
    return reflected.xy / m + 0.5;
}

// Distance signée pour un tore
float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

// Distance signée pour une sphère
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

// Distance signée pour une boîte
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Matrice de rotation autour d'un axe donné
mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat4(
        oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0,
        oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0,
        oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

// Fonction de lissage pour adoucir les intersections
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// Fait tourner un vecteur autour d'un axe
vec3 rotate(vec3 v, vec3 axis, float angle) {
    return (rotationMatrix(axis, angle) * vec4(v, 1.0)).xyz;
}

// Génère un nombre aléatoire basé sur un vecteur 2D
float random(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

// Distance signée combinée pour plusieurs formes
float sdf(vec3 p) {
    vec3 p1 = rotate(p, vec3(1.0), time / 10.0);
    float box = sdTorus(p1, vec2(0.2));
    float mouseSphere = sdSphere(p - vec3(mouse * resolution.zw, 0), 0.2);
    
    float final = smin(box, mouseSphere, 0.1);
    for (float i = 0.0; i < balls; i++) {
        float randOffset = random(vec2(i, 0.0));
        float progress = fract(time / 2.0 + randOffset);
        vec3 pos = vec3(sin(randOffset * 2.0 * PI), cos(randOffset * 2.0 * PI), 0.0);
        float goToCenter = sdSphere(p - pos * progress, 0.1);
        final = smin(final, goToCenter, 0.1);
    }

    return final;
}

// Calcule la normale à la surface en utilisant des différences finies
vec3 calcNormal(in vec3 p) {
    const float eps = 0.0001;
    return normalize(vec3(
        sdf(p + vec3(eps, 0, 0)) - sdf(p - vec3(eps, 0, 0)),
        sdf(p + vec3(0, eps, 0)) - sdf(p - vec3(0, eps, 0)),
        sdf(p + vec3(0, 0, eps)) - sdf(p - vec3(0, 0, eps))
    ));
}

// Fonction principale du fragment shader
void main() {
    float dist = length(vUv - vec2(0.5));
    vec3 bg = mix(vec3(0.0), vec3(0.0), dist);
    vec2 newUv = ((vUv - vec2(0.5)) * resolution.zw + vec2(0.5));
    vec3 camPos = vec3(0.0, 0.0, 2.0);
    vec3 ray = normalize(vec3((vUv - vec2(0.5)) * resolution.zw, -1));

    float scalarValue = 0.0;
    float scalarMax = 5.0;

    // Ray marching pour trouver l'intersection
    for (int i = 0; i < 256; ++i) {
        vec3 pos = camPos + scalarValue * ray;
        float rayDistanceToPoint = sdf(pos);
        if (rayDistanceToPoint < 0.0001 || scalarValue > scalarMax) break;
        scalarValue += rayDistanceToPoint;
    }

    vec3 color = bg;
    if (scalarValue < scalarMax) {
        vec3 pos = camPos + scalarValue * ray;
        vec3 normal = calcNormal(pos);
        float diff = dot(vec3(1.0), normal);
        vec2 matcapUv = getmatcap(ray, normal);
        color = texture2D(matcap, matcapUv).rgb;
        float fresnel = pow(1.0 + dot(ray, normal), 1.0);
        color = mix(color, bg, fresnel);
    }

    gl_FragColor = vec4(color, 1.0);
}
