const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

const generateQRCode = async (dtid, data) => {
  try {
    const qrData = JSON.stringify({
      dtid: dtid,
      verificationUrl: `${process.env.QR_CODE_BASE_URL}/qr/verify/${dtid}`,
      timestamp: new Date().toISOString(),
      ...data
    });

    // Ensure qr-codes directory exists
    const qrDir = path.join(__dirname, '../../public/qr-codes');
    try {
      await fs.access(qrDir);
    } catch (error) {
      await fs.mkdir(qrDir, { recursive: true });
    }

    const fileName = `qr_${dtid}.png`;
    const filePath = path.join(qrDir, fileName);
    
    await QRCode.toFile(filePath, qrData, {
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256,
      margin: 2
    });

    return `/qr-codes/${fileName}`;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

const decodeQRData = (qrData) => {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    throw new Error('Invalid QR code data format');
  }
};

module.exports = {
  generateQRCode,
  decodeQRData
};