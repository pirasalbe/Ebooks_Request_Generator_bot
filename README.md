# Ebooks Request Generator bot

Telegram bot that creates a text message from the link address of an ebook or an audio book.

[Open on Telegram.](http://t.me/ebooks_request_generator_bot)

## Commands

- `/start` and `/help`: show an help message.
- `/inline`: show an help message for inline mode.
- text: given a link or a text containing a link, it returns the request message.
- `/report` text: works the same way it does with _text_, but it returns a _report.html_ file when errors occur.
- inline: the bot works inline the same way it does with _text_.
- `/stats`: sends information about the number of request received.
- `/refresh`: reloads the information for the filters.

## Message format

```
#request [tags]
Title: [book title]
Author: [book author]
Publisher: [book publisher]
Link: [link received]
```

The available tags are:

- language tag, such as _#italian_, _#french_, etc
- kindle unlimited tag **#KU**
- audiobook tag **#audiobook**
- Scribd tag **#scribd** for requests from Scribd
- Storytel tag **#storytel** for requests from Storytel
- Archive tag **#archive** for requests from Archive and OpenLibrary

The tags are automatically added based on the url provided.

---

Example:

```
#request
Title: Serpentine
Author: Philip Pullman
Publisher: Knopf Books for Young Readers
Link: https://www.amazon.com/His-Dark-Materials-Philip-Pullman-ebook/dp/B08CL2WJ34/ref=tmm_kin_swatch_0?_encoding=UTF8&qid=1634305599&sr=8-1
```

# Features

## Sources

### Extract message from Amazon

Given an Amazon link of a Kindle book, it returns the request message.

**Amazon languages supported**:

- en: English
- it: Italian
- de: German
- es: Spanish
- fr: French

### Extract message from Audible

Given an Audible link of an audiobook, it returns the request message.

It always add the _#audiobook_ tag.

### Extract message from Scribd

Given a Scribd link of either an ebook or an audiobook, it returns the request message.

It always add the _#scribd_ tag. If it is an audiobook, it also add the _#audiobook_ tag.

### Extract message from Storytel

Given a Storytel link of either an ebook or an audiobook, it returns the request message.

It always add the _#storytel_ tag. If it is an audiobook, it also add the _#audiobook_ tag.

### Extract message from Archive

Given a Archive link of an ebook, it returns the request message.

It always add the _#archive_ tag.

### Extract message from OpenLibrary

Given a OpenLibrary link of an ebook, it returns the request message.

It always add the _#archive_ tag.

## Filters

### Format

- Amazon: Kindle ebooks.
- Audible: audiobooks.
- Scribd: ebooks or audiobooks.
- Storytel: ebooks or audiobooks.
- Archive: ebooks.
- OpenLibrary: ebooks.

### Release Date

The publication date of the given product cannot be in the future.

### Authors, Titles, Publishers

The book or the author must not be protected by DMCA and the publisher must not be academic.

# Known bugs

- Cannot get language information from Scribd links

- Cannot get informations from some Storytel links ([example](https://www.storytel.com/in/en/books/770401-Pradnyavant-2---Pardeshi))

# Instructions

## Build

```
npm run build
```

## Deploy

Start script

```
npm start
```

&nbsp;

Define _token_ and run the project

```
BOT_TOKEN="110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw" npm start
```

_Replace the token in the command, which is **invalid**, with your own._

### Twitter service

The bot can send a tweet for each request.

Define the following variables and run the project

```
BOT_TOKEN="110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw" TWITTER_APP_KEY="twitter_variable" TWITTER_APP_SECRET="twitter_variable" TWITTER_ACCESS_TOKEN="twitter_variable" TWITTER_ACCESS_SECRET="twitter_variable" npm start
```
