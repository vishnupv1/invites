import fs from "node:fs";
import path from "node:path";
import React from "react";
import satori from "satori";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";

const WIDTH = 1200;
const HEIGHT = 630;
const FONT = path.resolve("node_modules/@fontsource/inter/files/inter-latin-600-normal.woff");

function frame(children) {
  return React.createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #F7FBF8 0%, #E4F0E8 100%)",
        fontFamily: "Inter",
        color: "#1C3A2A",
      },
    },
    children,
  );
}

function label(text, size) {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        fontSize: size,
        fontWeight: 600,
        letterSpacing: size > 24 ? -0.8 : 3.2,
        color: size > 24 ? "#1C3A2A" : "#3E6B52",
      },
    },
    text,
  );
}

function coverCard(src) {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        background: "#ffffff",
        padding: "8px",
        borderRadius: "18px",
        boxShadow: "0 18px 40px rgba(28, 58, 42, 0.14)",
      },
    },
    React.createElement("img", {
      src,
      width: 248,
      height: 360,
      style: { borderRadius: "12px", objectFit: "cover" },
    }),
  );
}

function templateCard(name, coverSrc) {
  const children = [];
  if (coverSrc) children.push(coverCard(coverSrc));
  children.push(
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: coverSrc ? "22px" : "0",
        },
      },
      [label(name, coverSrc ? 40 : 64), React.createElement("div", { style: { display: "flex", height: "12px" } }), label("INVITESREADY", 16)],
    ),
  );
  return frame(children);
}

function wordmarkCard(title, subtitle) {
  return frame([
    label(title, 68),
    React.createElement("div", { style: { display: "flex", height: "16px" } }),
    label(subtitle, 18),
  ]);
}

async function raster(element, fonts) {
  const svg = await satori(element, { width: WIDTH, height: HEIGHT, fonts });
  const png = new Resvg(svg).render().asPng();
  return sharp(png).jpeg({ quality: 82 }).toBuffer();
}

async function coverSrc(root, id) {
  const file = path.join(root, "public/covers", `${id}.jpg`);
  if (!fs.existsSync(file)) return null;
  const jpeg = await sharp(file).resize(496, 720, { fit: "cover", position: "centre" }).jpeg({ quality: 80 }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

function writeAll(dirs, name, buffer) {
  for (const dir of dirs) fs.writeFileSync(path.join(dir, name), buffer);
}

export async function writeShareImages(root, templates) {
  const dirs = [path.join(root, "public/og")];
  if (fs.existsSync(path.join(root, "dist"))) dirs.push(path.join(root, "dist/og"));
  for (const dir of dirs) fs.mkdirSync(dir, { recursive: true });

  const fonts = [
    {
      name: "Inter",
      data: fs.readFileSync(FONT),
      weight: 600,
      style: "normal",
    },
  ];

  const home = await raster(wordmarkCard("InvitesReady", "ANIMATED DIGITAL INVITATIONS"), fonts);
  writeAll(dirs, "home.jpg", home);
  const browseCover = await coverSrc(root, "shaadi");
  const browse = await raster(
    browseCover ? templateCard("Invitation templates", browseCover) : wordmarkCard("Invitation templates", "INVITESREADY"),
    fonts,
  );
  writeAll(dirs, "browse.jpg", browse);

  const missing = [];
  for (const template of templates) {
    const src = await coverSrc(root, template.id);
    if (!src) missing.push(template.id);
    const image = await raster(templateCard(template.name, src), fonts);
    writeAll(dirs, `${template.id}.jpg`, image);
  }
  if (missing.length) console.log(`SEO: no cover for ${missing.join(", ")}; those share images are name-only`);
  return { width: WIDTH, height: HEIGHT };
}
