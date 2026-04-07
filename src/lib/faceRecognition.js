let isReady = false;
let faceapiModule = null;

async function getFaceApi() {
  if (!faceapiModule) {
    faceapiModule = await import("face-api.js");
  }

  return faceapiModule;
}

export async function initializeFaceModels() {
  if (isReady) {
    return;
  }

  const faceapi = await getFaceApi();
  const modelBaseUri = "/models";

  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(modelBaseUri),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelBaseUri),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelBaseUri)
  ]);

  isReady = true;
}

function detectInBrowserFromBase64(base64String) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = async () => {
      try {
        const faceapi = await getFaceApi();
        const detection = await faceapi
          .detectSingleFace(image)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          resolve(null);
          return;
        }

        const box = detection.detection.box;
        resolve({
          descriptor: Array.from(detection.descriptor),
          box: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          }
        });
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => reject(new Error("Unable to load captured image for detection."));
    image.src = base64String.startsWith("data:") ? base64String : `data:image/jpeg;base64,${base64String}`;
  });
}

export async function detectFaceAndDescriptorFromBase64(base64String) {
  await initializeFaceModels();
  return detectInBrowserFromBase64(base64String);
}

export async function detectFaceAndDescriptorFromVideo(videoElement) {
  await initializeFaceModels();

  const faceapi = await getFaceApi();
  const detection = await faceapi
    .detectSingleFace(videoElement)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return null;
  }

  const box = detection.detection.box;
  return {
    descriptor: Array.from(detection.descriptor),
    box: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height
    }
  };
}

export function euclideanDistance(descriptorA, descriptorB) {
  if (!descriptorA || !descriptorB || descriptorA.length !== descriptorB.length) {
    return Number.POSITIVE_INFINITY;
  }

  let sum = 0;
  for (let i = 0; i < descriptorA.length; i += 1) {
    const diff = descriptorA[i] - descriptorB[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

export function findBestMatch(targetDescriptor, workers, threshold = 0.5) {
  let best = null;

  for (const worker of workers) {
    const stored = worker.face_descriptor;
    if (!Array.isArray(stored)) {
      continue;
    }

    const distance = euclideanDistance(targetDescriptor, stored);

    if (!best || distance < best.distance) {
      best = {
        worker,
        distance
      };
    }
  }

  if (!best || best.distance >= threshold) {
    return null;
  }

  return best;
}
