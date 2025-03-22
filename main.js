const express = require('express');
const app = express();
const router = express.Router();

function createPromise(id, delay, name) {
  return new Promise((resolve) => {
    console.log(`${id} - processing ${name} function`);
    setTimeout(() => {
      console.log(`${id} - ${name} function completed`);
      resolve(`${id} - ${name} result`);
    }, delay * 1000);
  });
}

function generateRequestId() {
  return Math.random().toString(36).substring(2, 15);
}

router.get('/first', async (req, res) => {
  const requestId = generateRequestId();

  try {
    // This one runs like sync code. Syntactic Sugar of /third
    // Two benefits,
    
    // 1. try catch can handle the errors from any of them
    // 2. the first one's results can be used in the subsequent createPromise() if needed
    const result1 = await createPromise(requestId, 3, 'promise1');
    const result2 = await createPromise(requestId, 4, 'promise2');
    const result3 = await createPromise(requestId, 5, 'promise3');

    res.send(`${requestId} - All promises resolved: ${result1}, ${result2}, ${result3}`);
  } catch (error) {
    console.error(`${requestId} - Error: ${error}`);
    res.status(500).send(`${requestId} - Error processing promises`);
  }
});

router.get('/second', (req, res) => {
  const requestId = generateRequestId();

  // No await
  // Behaves like 
  // go createPromise(&wg, 1)
  // go createPromise(&wg, 2)
  // go createPromise(&wg, 3)
  // go createPromise(&wg, 4)

  // Promise.All()'s then() block is kinda equivalent to wg.wait()
  const promise1 = createPromise(requestId, 3, 'promise1');
  const promise2 = createPromise(requestId, 4, 'promise2');
  const promise3 = createPromise(requestId, 5, 'promise3');

  Promise.all([promise1, promise2, promise3])
    .then((results) => {
      res.send(`${requestId} - All promises resolved: ${results.join(', ')}`);
    })
    .catch((error) => {
      console.error(`${requestId} - Error: ${error}`);
      res.status(500).send(`${requestId} - Error processing promises`);
    })
    .finally(() => {
      console.log(`${requestId} - Promise processing finished`);
    });
});

router.get('/third', (req, res) => {
  const requestId = generateRequestId();

  createPromise(requestId, 3, 'promise1')
    .then((result1) => {
      console.log(`${requestId} - Result 1: ${result1}`);
      return createPromise(requestId, 4, 'promise2');
    })
    .then((result2) => {
      console.log(`${requestId} - Result 2: ${result2}`);
      return createPromise(requestId, 5, 'promise3');
    })
    .then((result3) => {
      console.log(`${requestId} - Result 3: ${result3}`);
      res.send(`${requestId} - All promises resolved: ${result1}, ${result2}, ${result3}`);
    })
    .catch((error) => {
      console.error(`${requestId} - Error: ${error}`);
      res.status(500).send(`${requestId} - Error processing promises`);
    })
    .finally(() => {
      console.log(`${requestId} - Promise processing finished`);
    });
});

router.get('/fourth', (req, res) => {
  const requestId = generateRequestId();

  // Similar to `/second`
  // if first createPromise() function's value is important to the next (second createPromise() and so on),
  // then this approach won't work

  // This is equivalent to 
  // go createPromise(nil, 1)
  // go createPromise(nil, 2)
  // go createPromise(nil, 3) // nil is the waitgroup

  // Also, js doens't have channels, so no way to communicate from Result: 1 to Result : 2
  createPromise(requestId, 3, 'promise1').then((result1) => console.log(`${requestId} - Result 1: ${result1}`))
  createPromise(requestId, 4, 'promise2').then((result2) => console.log(`${requestId} - Result 2: ${result2}`))
  createPromise(requestId, 5, 'promise3').then((result3) => console.log(`${requestId} - Result 3: ${result3}`))

});

app.use('/', router);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
