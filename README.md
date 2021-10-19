# Ebooks Request Generator bot
Telegram bot that creates a text message from the link address of an Ebook.

[Open on Telegram.](http://t.me/ebooks_request_generator_bot)

Message example:
```
#request
Title: Serpentine
Author: Philip Pullman
Publisher: Knopf Books for Young Readers
Link: https://www.amazon.com/His-Dark-Materials-Philip-Pullman-ebook/dp/B08CL2WJ34/ref=tmm_kin_swatch_0?_encoding=UTF8&qid=1634305599&sr=8-1
```

## Features

### Extract message from Amazon

Received an Amazon link, it returns a message with the following format.
```
#request [tags]
Title: [book title]
Author: [book author]
Publisher: [book publisher]
Link: [link received]
```

The available tags are:
* language tag, such as *#italian*, *#french*, etc
* kindle unlimited tag **#KU**

The tags are automatically added based on the url provided.

## Build instructions

TODO

## Deploy instructions

TODO
