const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDefaultTimeSettings() {
  try {
    // Check if time settings already exist
    const existingSettings = await prisma.timeSettings.findFirst({
      where: {
        isActive: true
      }
    });

    if (existingSettings) {
      console.log('Time settings already exist:', existingSettings);
      return existingSettings;
    }

    // Create default time settings
    const timeSettings = await prisma.timeSettings.create({
      data: {
        maxClockInTime: '07:00',    // 7:00 AM
        minClockOutTime: '17:00',   // 5:00 PM
        isActive: true
      }
    });

    console.log('Default time settings created:', timeSettings);
    return timeSettings;
  } catch (error) {
    console.error('Error creating time settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultTimeSettings(); 