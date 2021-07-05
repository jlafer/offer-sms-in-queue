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
  console.log(`${FN_NAME}: event`, event);
  const {SYNC_SERVICE_SID} = context;
  const twiml = new Twilio.twiml.VoiceResponse();
  const {state, wait} = event;
  const client = context.getTwilioClient();
  switch (state) {
    case 'initial':
      twiml.redirect('https://jlafer-demo.ngrok.io/waitTreatment?state=makeOffer')
      break;
    case 'playMusic':
      twiml.say('Imagine this is music designed to keep you from hanging up.');
      twiml.say('We apologize for the delay.');
      twiml.pause({length: 5});
      twiml.redirect('https://jlafer-demo.ngrok.io/waitTreatment?state=initial')
      break;
    case 'makeOffer':
      twiml.say('Wait times are high.');
      const gather = twiml.gather({
        action: 'https://jlafer-demo.ngrok.io/waitTreatment?state=altSelected',
        method: 'POST'
      });
      gather.say('Press 1 to switch to text support. Or remain on the line to keep holding.');
      twiml.say('We did not get your input.');
      twiml.redirect('https://jlafer-demo.ngrok.io/waitTreatment?state=playMusic')
      break;
    case 'altSelected':
      await client.messages.create({from: '+15205100995', to: '+12088747271', body: 'To confirm text support, please reply with YES'});
      twiml.say('We just sent you a text message. To confirm text support, please reply with YES to that message.');
      twiml.redirect('https://jlafer-demo.ngrok.io/waitTreatment?state=awatingSmsOptIn&wait=0');
      break;
    case 'awatingSmsOptIn':
      const doc = await getSyncDocByName(client, SYNC_SERVICE_SID, event.From);
      console.log(`${FN_NAME}: sync doc`, doc);
      if (!doc) {
        twiml.say(`We have waited for ${wait} seconds.`);
        const waitNum = parseInt(wait) + 5;
        if (waitNum > 15)
          twiml.redirect('https://jlafer-demo.ngrok.io/waitTreatment?state=playMusic')
        else {
          twiml.pause({length: 5});
          const cumWait = waitNum.toString();
          twiml.redirect(`https://jlafer-demo.ngrok.io/waitTreatment?state=awatingSmsOptIn&wait=${cumWait}`);
        }
      }
      else {
        const optedIn = doc.data.smsSupport;
        if ( ['Yes', 'YES', 'yes'].includes(optedIn) )
          twiml.redirect('https://jlafer-demo.ngrok.io/waitTreatment?state=optedForSms')
        else
          twiml.redirect('https://jlafer-demo.ngrok.io/waitTreatment?state=playMusic')
      }
      break;
    case 'optedForSms':
      twiml.pause({length: 2});
      twiml.say('Okay. We queued you for a text specialist. You can hangup.');
      twiml.pause({length: 2});
      twiml.hangup();
      break;
    default:
      twiml.redirect('https://jlafer-demo.ngrok.io/waitTreatment?state=initial')
  }
  callback(null, twiml);
};
