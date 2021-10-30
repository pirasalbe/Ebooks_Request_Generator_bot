import { ApplicationContext } from './application.context';

// start application
try {
  new ApplicationContext();
} catch (error) {
  console.error('Error starting context', error);
}
