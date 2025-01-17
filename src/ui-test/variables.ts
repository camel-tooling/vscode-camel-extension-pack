import * as path from 'path';

export const RESOURCES_DIR = path.resolve('.', 'src', 'ui-test', 'resources');

export const DEBUGGER_ATTACHED_MESSAGE = 'debugger has been attached';

export const DEMO_FILE = 'Demo.java';

export const SPRINGBOOT_DIR = path.join(RESOURCES_DIR, 'springboot');
export const SPRINGBOOT_CREATE_COMMAND = 'Camel: Create a Camel on SpringBoot project';
export const SPRINGBOOT_ATTACH_DEBUGGER = 'Run Camel Spring Boot application and attach Camel debugger';
export const SPRINGBOOT_PROJECT_FOLDER = path.join(SPRINGBOOT_DIR, 'src', 'main', 'java', 'com', 'demo', 'test');

export const QUARKUS_DIR = path.join(RESOURCES_DIR, 'quarkus');
export const QUARKUS_CREATE_COMMAND = 'Camel: Create a Camel Quarkus project';
export const QUARKUS_ATTACH_DEBUGGER = 'Run Camel Quarkus JVM application and attach Camel debugger';
export const QUARKUS_PROJECT_FOLDER = path.join(QUARKUS_DIR, 'src', 'main', 'java', 'com', 'demo', 'test');
