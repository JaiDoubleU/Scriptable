const contacts_list = [
  {
    name: "Carrie",
    phone: "+14036069833",
    type: "sms",
    photo: "Carrie.png",
  },
  {
    name: "Ethan",
    phone: "+4033998151",
    type: "sms",
    photo: "Ethan.png",
  },
  {
    name: "Emma",
    phone: "+14034003307",
    type: "sms",
    photo: "Emma.png",
  },
  {
    name: "Kristin",
    phone: "+14036080665",
    type: "sms",
    photo: "Kristin.png",
  }
];
const MAYA_BLUE = "#5FC9F8";
const SUNGLOW = "#FECB2E";
const RADICAL_RED = "#FC3158";
const CRAYOLA_BLUE = "#147EFB";
const EMERALD = "#53D769";
const CORAL_RED = "#FC3D39";
const BG_COLOR = Color.dynamic(new Color(MAYA_BLUE),Color.blue());
const FG_COLOR = Color.dynamic(Color.black(),Color.white() );

const SETTINGS = {
  BG_COLOR: BG_COLOR,
  BG_IMAGE: {
    SHOW_BG: false,
    IMAGE_PATH: "bg.png",
  },
  BG_OVERLAY: {
    SHOW_OVERLAY: false,
    OVERLAY_COLOR:MAYA_BLUE,
    OPACITY: 0.1,
  },
  PADDING: 14,
  TITLE_TEXT:"Start a Conversation",
  TITLE_FONT_SIZE: 16,
  TITLE_FONT_COLOR: FG_COLOR,
  PHOTO_SIZE: 70,
  NAME_FONT_SIZE: 14,
  RANDOMIZE_CONTACTS: true,
  NO_OF_CONTACTS_TO_SHOW: 4,
};

// check if RANDOMIZE_CONTACTS is enabled. If it's set to `true`, randomize the contacts_list array.
if (SETTINGS.RANDOMIZE_CONTACTS == true) {
  contacts = [...contacts_list]
    .sort(() => 0.5 - Math.random())
    .slice(0, SETTINGS.NO_OF_CONTACTS_TO_SHOW);
} else {
  contacts = [...contacts_list].slice(0, SETTINGS.NO_OF_CONTACTS_TO_SHOW);
}

// A function to download images
async function getImg(image) {
  let folderName = "Conversable";

  let fm = FileManager.iCloud();
  let dir = fm.documentsDirectory();
  let path = fm.joinPath(dir + "/" + folderName, image);
  let download = await fm.downloadFileFromiCloud(path);
  let isDownloaded = await fm.isFileDownloaded(path);

  if (fm.fileExists(path)) {
    return fm.readImage(path);
  } else {
    console.log("Error: File does not exist.");
  }
}

async function CreateAction(contact) {
  let { phone, email, twitter_id, telegram_username } = contact;
  let serviceUrl;
  let icon;

  switch (contact.type) {
    case "sms":
      serviceUrl = `sms://${phone}`;
      icon = "icons/sms.png";
      break;
    case "call":
      serviceUrl = `tel://${phone}`;
      icon = "icons/phone.png";
      break;
    case "mail":
      serviceUrl = `mailto://${email}`;
      icon = "icons/mail.png";
      break;
    case "facetime":
      serviceUrl = `facetime://${phone}`;
      icon = "icons/facetime.png";
      break;
    case "facetime-audio":
      serviceUrl = `facetime-audio://${phone}`;
      icon = "icons/facetime.png";
      break;
    case "whatsapp":
      serviceUrl = `whatsapp://send?text=&phone=${phone}`;
      icon = "icons/whatsapp.png";
      break;
    case "twitter":
      serviceUrl = `twitter://messages/compose?recipient_id=${twitter_id}`;
      icon = "icons/twitter.png";
      break;
    case "telegram":
      serviceUrl = `tg://resolve?domain=${telegram_username}`;
      icon = "icons/telegram.png";
      break;
  }

  return { serviceUrl, icon };
}

// A function to create contacts (to be displayed in the widget).
async function CreateContact(contact, row) {
  let { PHOTO_SIZE, NAME_FONT_SIZE } = SETTINGS;

  let { photo, name } = contact;
  let { serviceUrl, icon } = await CreateAction(contact);

  let contactStack = row.addStack();
  contactStack.layoutVertically();
  contactStack.textColor=FG_COLOR;

  contactStack.url = serviceUrl;
 contactStack.centerAlignContent();

  let photoStack = contactStack.addStack();

//   photoStack.addSpacer();

  let img = await getImg(photo);
  let contactPhoto = photoStack.addImage(img);
  contactPhoto.imageSize = new Size(PHOTO_SIZE, PHOTO_SIZE);
  contactPhoto.cornerRadius = PHOTO_SIZE / 2;
 contactPhoto.applyFillingContentMode();

  photoStack.addSpacer(5);

  contactStack.addSpacer(2);
  var cname = contactStack.addText("    "+contact.name);
  cname.font=Font.regularSystemFont(NAME_FONT_SIZE),
  cname.textColor=FG_COLOR;

  let nameStack = contactStack.addStack();

//   nameStack.addSpacer();

  let iconPath = await getImg(icon);
  let appIcon = nameStack.addImage(iconPath);
  appIcon.imageSize = new Size(16, 16);
}

async function CreateWidget(contacts) {
  let { BG_COLOR, BG_IMAGE, BG_OVERLAY, PADDING, TITLE_FONT_SIZE, TITLE_TEXT} = SETTINGS;

  let w = new ListWidget();
  w.backgroundColor = BG_COLOR;
  w.textColor = SETTINGS.TITLE_FONT_COLOR;
  w.setPadding(PADDING, PADDING, PADDING, PADDING);

  // Show background image if SHOW_BG is set to `true`.
  if (BG_IMAGE.SHOW_BG == true) {
    let bg = await getImg(BG_IMAGE.IMAGE_PATH);
    w.backgroundImage = bg;
  }

  // Show overlay if SHOW_OVERLAY is set to `true`. For light background images, it is recommended that you turn overlay on so that the contact names and text remain legible.
  if (BG_OVERLAY.SHOW_OVERLAY == true) {
    let overlayColor = new Color(
      BG_OVERLAY.OVERLAY_COLOR,
      BG_OVERLAY.OPACITY || 0.3
    );
    let gradient = new LinearGradient();
    gradient.colors = [overlayColor, overlayColor];
    gradient.locations = [0, 1];
    w.backgroundGradient = gradient;
  }

//   w.addSpacer();

  let containerStack = w.addStack();
  containerStack.layoutVertically();
containerStack.textColor=FG_COLOR;
  let titleStack = containerStack.addStack();
  titleStack.centerAlignContent();
  titleStack.addSpacer();

  let title = titleStack.addText(TITLE_TEXT);
  title.font = Font.semiboldSystemFont(TITLE_FONT_SIZE);
  title.textColor=FG_COLOR;

  titleStack.addSpacer();

  containerStack.addSpacer(15);
  containerStack.centerAlignContent();

  let contactRowStack = containerStack.addStack();
  contactRowStack.centerAlignContent();

  contactRowStack.addSpacer();

  contacts.map((contact) => {
    CreateContact(contact, contactRowStack);
  });

  contactRowStack.addSpacer();

  w.addSpacer();

  Script.setWidget(w);

  return w;
}

let w = await CreateWidget(contacts);
w.presentMedium();
Script.complete();
