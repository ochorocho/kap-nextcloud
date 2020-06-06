const login = require('./login')
const upload = require('./upload')

const action = async context => {
  if (!context.config.has('username') || !context.config.has('password')) {
    context.setProgress('Authorizing…')
    try {
      await login(context)
    } catch (error) {
      if (error.message === 'canceled') {
        context.cancel()
      } else {
        console.error(error.message)
      }
      return
    }
  }

  const filePath = await context.filePath()
  upload(context, filePath)
}

const nextcloud = {
  title: 'Share to Nextcloud',
  formats: ['gif', 'mp4', 'webm', 'apng'],
  action,
  config: {
    url: {
      title: 'Nextcloud Url',
      type: 'string',
      required: true
    },
    path: {
      title: 'Nextcloud Path',
      description: 'Path where Files are stored on Nextcloud',
      type: 'string',
      default: '/',
      required: true
    },
    lifeTime: {
      title: 'Share Lifetime in Days',
      type: 'string',
      default: '10'
    },
    randomPassword: {
      title: 'Set random Password for Share',
      description: 'Link and Password will be Copied to Clipboard',
      default: false,
      type: 'boolean'
    }
  }
}

exports.shareServices = [nextcloud]
