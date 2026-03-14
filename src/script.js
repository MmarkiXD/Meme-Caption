document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("memeCanvas");
  const ctx = canvas.getContext("2d");

  const captionInput = document.getElementById("caption");
  const importBtn = document.getElementById("importBtn");
  const imageUpload = document.getElementById("imageUpload");
  const downloadBtn = document.getElementById("downloadBtn");
  const fontSizeInput = document.getElementById("fontSize");
  
  let uploadedImage = null;
  
  /* Emoji */

  function isEmoji(char) {
    return /\p{Extended_Pictographic}/u.test(char);
  }

  function getEmojiURL(emoji) {
    const code = twemoji.convert.toCodePoint(emoji);

    return `https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/${code}.png`;
  }

  async function drawLineWithTwemoji(line, startX, y) {
    let cursorX = startX;

    for (let char of line) {
      if (isEmoji(char)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = getEmojiURL(char);

        await new Promise(resolve => {
          img.onload = resolve;
        });
        
        const fontSize = parseInt(fontSizeInput.value) || 45;
        const size = fontSize;

        ctx.drawImage(img, cursorX, y - size * 0.8, size, size);

        cursorX += size + 4;
      } else {
        ctx.fillText(char, cursorX, y);
        cursorX += ctx.measureText(char).width;
      }
    }
  }

  /* Import button */

  importBtn.addEventListener("click", () => {
    imageUpload.click();
  });

  /* Upload image */

  imageUpload.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = event => {
      uploadedImage = new Image();
      uploadedImage.src = event.target.result;

      uploadedImage.onload = () => {
        generateMeme();
      };
    };

    reader.readAsDataURL(file);
  });

  /* Update when typing */

  captionInput.addEventListener("input", () => {
    if (uploadedImage) {
      generateMeme();
    }
  });
  
  fontSizeInput.addEventListener("input", () => {
    if (uploadedImage) {
      generateMeme();
    }
  });

  /* Wrap text */
  function wrapText(text, maxWidth) {
    const words = text.split(" ");
    let lines = [];
    let currentLine = "";

    for (let word of words) {
      let testLine = currentLine + word + " ";
      let width = ctx.measureText(testLine).width;

      /* Normal wrap */

      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        /* Push current line */

        if (currentLine !== "") {
          lines.push(currentLine.trim());
          currentLine = "";
        }

        /* Break very long words */

        let chars = word.split("");
        let part = "";

        for (let char of chars) {
          let testPart = part + char;
          let partWidth = ctx.measureText(testPart).width;

          if (partWidth > maxWidth) {
            lines.push(part);
            part = char;
          } else {
            part = testPart;
          }
        }

        currentLine = part + " ";
      }
    }

    if (currentLine.trim() !== "") {
      lines.push(currentLine.trim());
    }

    return lines;
  }

  async function generateMeme() {
    if (!uploadedImage) return;
    
    const caption = captionInput.value || "";
    const fontSize = parseInt(fontSizeInput.value) || 45;
   
    const MAX_WIDTH = 500;

    let scale = MAX_WIDTH / uploadedImage.width;
    let imgWidth = uploadedImage.width * scale;
    let imgHeight = uploadedImage.height * scale;

    ctx.font = `bold ${fontSize}px Futura Bold Condensed`;
    
    const lines = wrapText(caption, imgWidth - 40);

    const lineHeight = fontSize * 1.4;
    const captionHeight = lines.length * lineHeight + 40;

    canvas.width = imgWidth;
    canvas.height = imgHeight + captionHeight;

    /* White caption background */

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, captionHeight);

    /* Caption text */

    ctx.textAlign = "left";
    ctx.fillStyle = "black";
    ctx.lineWidth = 4;
    ctx.font = `bold ${fontSize}px Futura Bold Condensed`;
    ctx.textBaseLine = "alphabetic";
    
    let y = fontSize + 20;

    for (let line of lines) {
      let lineWidth = getLineWidth(line);
      let startX = (canvas.width - lineWidth) / 2;

      await drawLineWithTwemoji(line, startX, y);
      y += lineHeight;
    }

    /* Draw image */

    ctx.drawImage(uploadedImage, 0, captionHeight, imgWidth, imgHeight);
    downloadBtn.disabled = false;
    captionInput.disabled = false;
    filename.disabled = false;
    fontSizeInput.disabled = false;
  }

  function getLineWidth(line) {
    let width = 0;

    for (let char of line) {
      if (isEmoji(char)) {
        const fontSize = parseInt(fontSizeInput.value) || 46;
        width += fontSize + 4;
      } else {
        width += ctx.measureText(char).width;
      }
    }
    return width;
  }

  /* Download meme */
  downloadBtn.addEventListener("click", () => {
    if (!canvas.width) return;

    const name = document.getElementById("filename").value;

    canvas.toBlob(blob => {
      
      if (name) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = name + ".png";
        link.click();
        } else {
        alert("Enter your filename to Export.");
      }
    });
  });
});
