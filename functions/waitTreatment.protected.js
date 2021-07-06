const getSyncDocByName = async (client, syncSvcSid, docName) => {
  try {
    const doc = await getSyncDoc(client, syncSvcSid, docName);
    return doc;  
  }
  catch (err) {
    return undefined;
  }
};

const getSyncDoc = (client, syncSvcSid, uniqueName) => {
  return client.sync.services(syncSvcSid).documents(uniqueName).fetch();
};

exports.handler = async function(context, event, callback) {
  const FN_NAME='waitTreatment';
  //console.log(`${FN_NAME}: event`, event);
  const {
    DOMAIN_NAME: RAW_DOMAIN_NAME,
    NGROK_SUBDOMAIN,
    SYNC_SERVICE_SID,
    BRAND,
    VOICE: RAW_VOICE
  } = context;
  const DOMAIN_NAME = NGROK_SUBDOMAIN ? `${NGROK_SUBDOMAIN}.ngrok.io` : RAW_DOMAIN_NAME;
  const VOICE = RAW_VOICE ? RAW_VOICE : 'woman';
  const twiml = new Twilio.twiml.VoiceResponse();
  const {From, To, dept: rawDept, state, wait} = event;
  const dept = rawDept ? rawDept : 'voice support';
  const deptParam = `&dept=${encodeURIComponent(dept)}`;
  const client = context.getTwilioClient();
  switch (state) {
    case 'initial':
      twiml.redirect(`https://${DOMAIN_NAME}/waitTreatment?state=makeOffer${deptParam}`)
      break;
    case 'playMusic':
      twiml.play('http://com.twilio.music.classical.s3.amazonaws.com/ith_chopin-15-2.mp3');
      twiml.say('We apologize for the delay.');
      twiml.pause({length: 5});
      twiml.redirect(`https://${DOMAIN_NAME}/waitTreatment?state=initial${deptParam}`)
      break;
    case 'makeOffer':
      twiml.say(
        {voice: `${VOICE}`},
        `Wait times for ${dept} are currently higher than normal.`
      );
      const gather = twiml.gather({
        action: `https://${DOMAIN_NAME}/waitTreatment?state=altSelected${deptParam}`,
        method: 'POST'
      });
      // NOTE here you could offer other alternatives, like voicemail or callback
      gather.say(
        {voice: `${VOICE}`},
        'Press 1 to switch to text support. Or remain on the line to keep holding.'
      );
      twiml.redirect(`https://${DOMAIN_NAME}/waitTreatment?state=playMusic${deptParam}`)
      break;
    case 'altSelected':
      // NOTE if you offer other alternatives, like voicemail or callback, check the caller's choice here
      await client.messages.create({from: `${To}`, to: `${From}`, body: `${BRAND}: To confirm text support, please reply YES`});
      twiml.say(
        {voice: `${VOICE}`},
        'We just sent you a text message. To confirm text support, please reply with YES to that message.'
      );
      twiml.redirect(`https://${DOMAIN_NAME}/waitTreatment?state=awatingSmsOptIn&wait=0${deptParam}`);
      break;
    case 'awatingSmsOptIn':
      const doc = await getSyncDocByName(client, SYNC_SERVICE_SID, From);
      console.log(`${FN_NAME}: sync doc`, doc);
      if (!doc) {
        //twiml.say(`We have waited for ${wait} seconds.`);
        const waitNum = parseInt(wait) + 5;
        if (waitNum > 15)
          twiml.redirect(`https://${DOMAIN_NAME}/waitTreatment?state=playMusic${deptParam}`)
        else {
          twiml.pause({length: 5});
          const cumWait = waitNum.toString();
          twiml.redirect(`https://${DOMAIN_NAME}/waitTreatment?state=awatingSmsOptIn&wait=${cumWait}${deptParam}`);
        }
      }
      else {
        const optedIn = doc.data.smsSupport;
        if ( ['Yes', 'YES', 'yes'].includes(optedIn) )
          twiml.redirect(`https://${DOMAIN_NAME}/waitTreatment?state=optedForSms${deptParam}`)
        else
          twiml.redirect(`https://${DOMAIN_NAME}/waitTreatment?state=playMusic${deptParam}`)
      }
      break;
    case 'optedForSms':
      twiml.pause({length: 2});
      twiml.say(
        {voice: `${VOICE}`},
        'Okay. A text specialist will be with you shortly. You can hangup this call.'
      );
      twiml.pause({length: 2});
      twiml.hangup();
      break;
    default:
      twiml.redirect(`https://${DOMAIN_NAME}/waitTreatment?state=initial${deptParam}`)
  }
  callback(null, twiml);
};
