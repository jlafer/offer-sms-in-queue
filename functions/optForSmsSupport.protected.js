exports.handler = async function(context, event, callback) {
  try {
    console.log('optForSmsSupport: event', event);
    const {body} = event;
    const optionMsg = JSON.parse(body);
    console.log('optForSmsSupport: optionMsg', optionMsg);
    const {docName, opt} = optionMsg;
    const client = context.getTwilioClient();
    const {SYNC_SERVICE_SID} = context;
    const syncDoc = await client.sync.services(SYNC_SERVICE_SID).documents.create({
      uniqueName: docName,
      data: {smsSupport: opt},
      ttl: 60
    });
    return callback(null, syncDoc);
  }
  catch (error) {
    console.log(error);
    callback(error, 'optForSmsSupport: something went wrong');
  }
};
