// Telegram.gs — Bot API helpers. Replies always go through the API, never the webhook response.

function tg(method, payload) {
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/' + method, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true,
  })
  var body = JSON.parse(res.getContentText())
  if (!body.ok) console.error('Telegram ' + method + ': ' + body.description)
  return body
}

function send(text, keyboard, chatId) {
  return tg('sendMessage', {
    chat_id: chatId || CHAT_ID,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined,
  })
}

function edit(messageId, text, keyboard) {
  return tg('editMessageText', {
    chat_id: CHAT_ID,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: keyboard || [] },
  })
}

function editKeyboard(messageId, keyboard) {
  return tg('editMessageReplyMarkup', { chat_id: CHAT_ID, message_id: messageId, reply_markup: { inline_keyboard: keyboard || [] } })
}

function answerCallback(id, text) {
  return tg('answerCallbackQuery', { callback_query_id: id, text: text || undefined })
}

function btn(text, data) {
  return { text: text, callback_data: data }
}

function rows(buttons, perRow) {
  var out = []
  for (var i = 0; i < buttons.length; i += perRow) out.push(buttons.slice(i, i + perRow))
  return out
}
