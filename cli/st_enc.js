import * as faceapi from "face-api.js";
import { parse } from "csv-parse/sync";

import canvas from "canvas";
import fs from "fs";

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const data = parse(fs.readFileSync("students.csv"));

async function main() {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromDisk("public/models/"),
    faceapi.nets.faceLandmark68TinyNet.loadFromDisk("public/models/"),
    faceapi.nets.faceRecognitionNet.loadFromDisk("public/models/"),
  ]);
  const nd = [];

  for (let student of data.slice(1)) {
    console.log(student[0]);
    // const img = await faceapi.bufferToImage(b64toBlob(student[2]));
    const im = new canvas.Image();
    im.src = student[2];

    const f = await faceapi
      .detectSingleFace(
        im,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 160,
          scoreThreshold: 0.5,
        })
      )
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    nd.push({
      name: student[0],
      usn: student[1],
      descriptor: f.descriptor.join(","),
    });
  }

  fs.writeFileSync("students_enc.json", JSON.stringify(nd));
}

main();
