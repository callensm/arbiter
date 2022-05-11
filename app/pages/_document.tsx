import Document, { Html, Head, Main, NextScript } from 'next/document'

class ArbiterDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta name="description" content="Signing documents with the power of Solana." />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Nunito&display=swap"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default ArbiterDocument
