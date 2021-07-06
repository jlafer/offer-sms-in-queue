# offer-sms-in-queue

This project provides two Twilio Flex Serverless functions that demonstrate how to offer channel-switching from voice to SMS for a caller who's waiting in a voice queue.

## Setup

Make sure you have [Node.js](https://nodejs.org) as well as [npm](https://npmjs.com) installed.

Afterwards, install the dependencies by running `npm install`:

```bash
cd offer-sms-in-queue

npm install
```

## Configure
This project was created with the [Twilio Serverless Toolkit](https://www.twilio.com/docs/labs/serverless-toolkit) and follows those development standards. It must be configured in your local project folder prior to deployment.

The functions rely on a set of environment variables. They should be set in a `.env` file, placed at the root folder of your project, prior to running and testing locally, and before deploying to Twilio Serverless. See the `.env.sample` file for an example of how the library functions can be configured.

### ACCOUNT_SID
This is your Twilio Account SID.

### AUTH_TOKEN
This is the Auth Token associated with the Twilio Account SID.

### SYNC_SERVICE_SID
This is the SID value for a Twilio Sync service. A Sync document is created in the service for each caller that is offered an alternative support channel. It can be the default Sync service though be careful of namespace collisions (it uses the caller's phone number). A new Sync service can be created easily in the Twilio Sync console and its SID copied/pasted.

### BRAND
This is the name of your brand, which is used in some `<Say>` and `<Message>` strings.

### VOICE
This an optional variable that specifies a Twilio voice to be used in all `<Say>` messages. If not supplied, the default value is `woman`. The sample shows how to specify a Polly voice.

### NGROK_SUBDOMAIN
This an optional variable that specifies an [ngrok](http://ngrok.io) private subdomain (registration required with ngrok). This is only required when doing local testing and development with `ngrok`. If not supplied, callback URLs will be constructed using the `DOMAIN_NAME` supplied by the Twilio Serverless toolkit (`localhost:3000` when testing locally) or by the Twilio Serverless platform (when deployed).

## Functions

### /waitTreatment
This function can be called from the `Hold Music TwiML URL` attribute of the [Send to Flex widget](https://www.twilio.com/docs/studio/widget-library/send-flex) in Twilio Studio for voice callers. To call the function, POST to the function's URL with a `state` query parameter set to `initial` and (optionally) a `dept` parameter set to the name of the department or function for whom the caller is waiting. The latter gets used in a `<Say>` message that offers SMS support to the caller. If not supplied, the default value is `voice support`.

### /optForSmsSupport
This function can be called from your Studio flow that handles customer replies to the SMS message offering to switch their support from voice to text. To call the function, simply POST in the body of the Serverless https request a `docName` parameter with the value set to the caller's mobile phone number and an `opt` parameter set to `Yes` or `No` (case insensitive) to indicate whether the caller wants to swtich to SMS for support. The request could like this: `{"docName": "+15551212", "opt": "Yes"}`.

## Deploy
To deploy the function(s) in this library, use the Twilio CLI and the Serverless Toolkit plugin. First, ensure that the CLI is using the correct Twilio project. You can verify that by running `twilio profiles:list`. The following command will deploy the functions to a service in the Twilio Serverless environment:
```
twilio serverless:deploy
```
Then, use the generated Twilio Serverless service domain in your function calls from your Studio flows or other applications.
