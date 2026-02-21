// Ramadan 1447 Widget for Scriptable
// Install: Open this URL in Scriptable or copy-paste into a new script
// Then add a Scriptable medium widget to your home screen

const WIDGET_URL = 'https://ramadan-calendar-ecru.vercel.app';
const API_URL = `${WIDGET_URL}/api/widget-data`;

async function createWidget() {
  // Get location
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
    data = {
      ramadanDay: '?', totalDays: 30, daysUntilEid: '?',
      imsak: '--:--', fajr: '--:--', maghrib: '--:--',
      fajrFraction: 0.24, maghribFraction: 0.76, imsakFraction: 0.23,
    };
  }

  // Compute dayProgress locally using device time (not server UTC)
  const now = new Date();
  const localMinutes = now.getHours() * 60 + now.getMinutes();
  data.dayProgress = localMinutes / 1440;

  const w = new ListWidget();
  w.url = WIDGET_URL;

  // Dynamic sky gradient based on local time of day
  const gradient = new LinearGradient();
  gradient.locations = [0, 0.5, 1];
  const skyColors = getSkyColors(data.dayProgress, data.fajrFraction, data.maghribFraction);
  gradient.colors = skyColors;
  w.backgroundGradient = gradient;
  w.setPadding(12, 16, 10, 16);

  // Title row
  const titleStack = w.addStack();
  titleStack.layoutHorizontally();
  titleStack.centerAlignContent();

  const title = titleStack.addText(`Day ${data.ramadanDay}`);
  title.font = Font.boldSystemFont(16);
  title.textColor = Color.white();

  titleStack.addSpacer();

  const subtitle = titleStack.addText('Ramadan 1447');
  subtitle.font = Font.systemFont(9);
  subtitle.textColor = new Color('#ffffff', 0.4);

  w.addSpacer(4);

  // Sun/Moon Arc — drawn with DrawContext
  const arcImg = drawArc(data.dayProgress, data.fajrFraction, data.maghribFraction, data.imsakFraction, data.imsak, data.maghrib);
  const arcStack = w.addStack();
  arcStack.addImage(arcImg);

  w.addSpacer(4);

  // Prayer times row
  const timesStack = w.addStack();
  timesStack.layoutHorizontally();

  addTimeBlock(timesStack, 'Imsak', data.imsak);
  timesStack.addSpacer();
  addTimeBlock(timesStack, 'Suhoor', data.fajr);
  timesStack.addSpacer();
  addTimeBlock(timesStack, 'Iftar', data.maghrib);

  w.addSpacer();

  // Countdown footer
  const footer = w.addText(`${data.daysUntilEid} days until Eid`);
  footer.font = Font.mediumSystemFont(9);
  footer.textColor = new Color('#ffffff', 0.25);
  footer.centerAlignText();

  // Refresh every 15 minutes for updated sun position
  const nextRefresh = new Date(Date.now() + 15 * 60 * 1000);
  w.refreshAfterDate = nextRefresh;

  return w;
}

function addTimeBlock(stack, label, time) {
  const block = stack.addStack();
  block.layoutVertically();

  const lbl = block.addText(label.toUpperCase());
  lbl.font = Font.systemFont(7);
  lbl.textColor = new Color('#ffffff', 0.3);

  block.addSpacer(1);

  const val = block.addText(time);
  val.font = Font.semiboldMonospacedSystemFont(13);
  val.textColor = new Color('#ffffff', 0.85);
}

function drawArc(dayProgress, fajrFrac, maghribFrac, imsakFrac, imsakTime, maghribTime) {
  const W = 300, H = 70;
  const ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const horizonY = 45;
  const margin = 20;
  const usable = W - 2 * margin;

  const fajrX = margin + fajrFrac * usable;
  const maghribX = margin + maghribFrac * usable;
  const imsakX = margin + imsakFrac * usable;
  const midX = (fajrX + maghribX) / 2;
  const peakY = 8;

  // Horizon line
  ctx.setStrokeColor(new Color('#ffffff', 0.08));
  ctx.setLineWidth(0.5);
  const horizonPath = new Path();
  horizonPath.move(new Point(margin, horizonY));
  horizonPath.addLine(new Point(W - margin, horizonY));
  ctx.addPath(horizonPath);
  ctx.strokePath();

  // Sun arc (dashed effect via segments)
  ctx.setStrokeColor(new Color('#ffffff', 0.1));
  ctx.setLineWidth(1);
  const steps = 40;
  for (let i = 0; i < steps; i++) {
    const t1 = i / steps;
    const t2 = (i + 0.5) / steps;
    const x1 = bezierX(t1, fajrX, midX, maghribX);
    const y1 = bezierY(t1, horizonY, peakY, horizonY);
    const x2 = bezierX(t2, fajrX, midX, maghribX);
    const y2 = bezierY(t2, horizonY, peakY, horizonY);

    const seg = new Path();
    seg.move(new Point(x1, y1));
    seg.addLine(new Point(x2, y2));
    ctx.addPath(seg);
    ctx.strokePath();
  }

  // Traveled arc (golden) if daytime
  if (dayProgress >= fajrFrac && dayProgress <= maghribFrac) {
    ctx.setStrokeColor(new Color('#facc3c', 0.3));
    ctx.setLineWidth(1.5);
    const tNow = (dayProgress - fajrFrac) / (maghribFrac - fajrFrac);
    const travelSteps = Math.floor(tNow * steps);
    for (let i = 0; i < travelSteps; i++) {
      const t1 = i / steps;
      const t2 = (i + 1) / steps;
      const x1 = bezierX(t1, fajrX, midX, maghribX);
      const y1 = bezierY(t1, horizonY, peakY, horizonY);
      const x2 = bezierX(t2, fajrX, midX, maghribX);
      const y2 = bezierY(t2, horizonY, peakY, horizonY);
      const seg = new Path();
      seg.move(new Point(x1, y1));
      seg.addLine(new Point(x2, y2));
      ctx.addPath(seg);
      ctx.strokePath();
    }
  }

  // Imsak tick
  ctx.setStrokeColor(new Color('#ffffff', 0.15));
  ctx.setLineWidth(0.5);
  const imsakTick = new Path();
  imsakTick.move(new Point(imsakX, horizonY - 3));
  imsakTick.addLine(new Point(imsakX, horizonY + 3));
  ctx.addPath(imsakTick);
  ctx.strokePath();

  // Maghrib tick
  const magTick = new Path();
  magTick.move(new Point(maghribX, horizonY - 3));
  magTick.addLine(new Point(maghribX, horizonY + 3));
  ctx.addPath(magTick);
  ctx.strokePath();

  // Time labels
  ctx.setTextColor(new Color('#ffffff', 0.2));
  ctx.setFont(Font.systemFont(7));
  ctx.drawText(imsakTime, new Point(imsakX - 12, horizonY + 5));
  ctx.drawText(maghribTime, new Point(maghribX - 12, horizonY + 5));

  // Sun/Moon orb
  let orbX, orbY, isSun;
  if (dayProgress >= fajrFrac && dayProgress <= maghribFrac) {
    const t = (dayProgress - fajrFrac) / (maghribFrac - fajrFrac);
    orbX = bezierX(t, fajrX, midX, maghribX);
    orbY = bezierY(t, horizonY, peakY, horizonY);
    isSun = true;
  } else {
    // Night — place below horizon
    const nightSpan = 1 - maghribFrac + fajrFrac;
    let nightT;
    if (dayProgress > maghribFrac) {
      nightT = (dayProgress - maghribFrac) / nightSpan;
    } else {
      nightT = (1 - maghribFrac + dayProgress) / nightSpan;
    }
    orbX = margin + nightT * usable;
    orbY = horizonY + Math.sin(nightT * Math.PI) * 18;
    isSun = false;
  }

  // Draw orb
  const orbR = 5;
  if (isSun) {
    // Glow
    ctx.setFillColor(new Color('#facc3c', 0.1));
    ctx.fillEllipse(new Rect(orbX - 10, orbY - 10, 20, 20));
    ctx.setFillColor(new Color('#facc3c', 0.2));
    ctx.fillEllipse(new Rect(orbX - 7, orbY - 7, 14, 14));
    // Sun
    ctx.setFillColor(new Color('#facc3c', 1));
    ctx.fillEllipse(new Rect(orbX - orbR, orbY - orbR, orbR * 2, orbR * 2));
  } else {
    // Moon glow
    ctx.setFillColor(new Color('#b4bedc', 0.08));
    ctx.fillEllipse(new Rect(orbX - 8, orbY - 8, 16, 16));
    // Moon
    ctx.setFillColor(new Color('#c8cddc', 1));
    ctx.fillEllipse(new Rect(orbX - orbR, orbY - orbR, orbR * 2, orbR * 2));
    // Crescent shadow
    ctx.setFillColor(new Color('#141432', 0.6));
    ctx.fillEllipse(new Rect(orbX - orbR + 3, orbY - orbR - 1, orbR * 2 - 2, orbR * 2));
  }

  return ctx.getImage();
}

function bezierX(t, x0, x1, x2) {
  return (1-t)*(1-t)*x0 + 2*(1-t)*t*x1 + t*t*x2;
}

function bezierY(t, y0, y1, y2) {
  return (1-t)*(1-t)*y0 + 2*(1-t)*t*y1 + t*t*y2;
}

function getSkyColors(p, fajr, maghrib) {
  if (p < fajr - 0.03) {
    return [new Color('#0a0a2e'), new Color('#101040'), new Color('#0d0d1a')];
  } else if (p < fajr) {
    return [new Color('#2a1545'), new Color('#6a3040'), new Color('#3a2030')];
  } else if (p < fajr + 0.04) {
    return [new Color('#4a2060'), new Color('#d46040'), new Color('#e8a050')];
  } else if (p < fajr + 0.08) {
    return [new Color('#4090d0'), new Color('#80c0e8'), new Color('#f0d890')];
  } else if ((p >= fajr + 0.08) && (p < (fajr + maghrib) / 2 + 0.05)) {
    return [new Color('#3080d0'), new Color('#60a8e0'), new Color('#90c8f0')];
  } else if (p < maghrib - 0.04) {
    return [new Color('#2060a0'), new Color('#d08040'), new Color('#e06830')];
  } else if (p < maghrib) {
    return [new Color('#1a1040'), new Color('#c04030'), new Color('#d06040')];
  } else if (p < maghrib + 0.04) {
    return [new Color('#101035'), new Color('#40204a'), new Color('#201030')];
  } else {
    return [new Color('#0a0a2e'), new Color('#101040'), new Color('#0d0d1a')];
  }
}

const widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}

Script.complete();
