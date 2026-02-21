// Ramadan 1447 Widget for Scriptable
// Add this script in the Scriptable app, then add a Scriptable widget to your home screen

const WIDGET_URL = 'https://ramadan-calendar-ecru.vercel.app';
const API_URL = `${WIDGET_URL}/api/widget-data`;

async function createWidget() {
  // Get location for prayer times
  let lat = 40.7128, lng = -74.006;
  try {
    const loc = await Location.current();
    lat = loc.latitude;
    lng = loc.longitude;
  } catch {}

  // Fetch data
  let data;
  try {
    const req = new Request(`${API_URL}?lat=${lat}&lng=${lng}`);
    data = await req.loadJSON();
  } catch {
    data = { ramadanDay: '?', totalDays: 30, daysUntilEid: '?', imsak: '--:--', fajr: '--:--', maghrib: '--:--' };
  }

  const w = new ListWidget();
  w.url = WIDGET_URL;

  // Background gradient
  const gradient = new LinearGradient();
  gradient.locations = [0, 0.5, 1];
  gradient.colors = [
    new Color('#1a3a5c'),
    new Color('#2a5a8c'),
    new Color('#1a2a3c'),
  ];
  w.backgroundGradient = gradient;
  w.setPadding(14, 16, 14, 16);

  // Title row
  const titleStack = w.addStack();
  titleStack.layoutHorizontally();
  titleStack.centerAlignContent();

  const title = titleStack.addText(`Day ${data.ramadanDay}`);
  title.font = Font.boldSystemFont(18);
  title.textColor = Color.white();

  titleStack.addSpacer();

  const subtitle = titleStack.addText('Ramadan 1447');
  subtitle.font = Font.systemFont(10);
  subtitle.textColor = new Color('#ffffff', 0.4);

  w.addSpacer(8);

  // Prayer times
  const timesStack = w.addStack();
  timesStack.layoutHorizontally();
  timesStack.spacing = 0;

  function addTimeBlock(stack, label, time) {
    const block = stack.addStack();
    block.layoutVertically();
    block.size = new Size(0, 0);

    const lbl = block.addText(label.toUpperCase());
    lbl.font = Font.systemFont(8);
    lbl.textColor = new Color('#ffffff', 0.35);

    block.addSpacer(2);

    const val = block.addText(time);
    val.font = Font.semiboldMonospacedSystemFont(14);
    val.textColor = new Color('#ffffff', 0.85);
  }

  addTimeBlock(timesStack, 'Imsak', data.imsak);
  timesStack.addSpacer();
  addTimeBlock(timesStack, 'Suhoor', data.fajr);
  timesStack.addSpacer();
  addTimeBlock(timesStack, 'Iftar', data.maghrib);

  w.addSpacer();

  // Countdown
  const footer = w.addText(`${data.daysUntilEid} days until Eid`);
  footer.font = Font.mediumSystemFont(10);
  footer.textColor = new Color('#ffffff', 0.3);
  footer.centerAlignText();

  return w;
}

const widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}

Script.complete();
