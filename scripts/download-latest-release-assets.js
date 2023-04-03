import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { exec } from 'node:child_process';
import url from 'node:url';
import { Octokit } from '@octokit/rest';
import { useEffect, useState } from 'react';
import { Text, render } from 'ink';
import Spinner from 'ink-spinner';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const nativeDir = path.resolve(__dirname, '..', 'native');
const octokit = new Octokit();

const mkNativeDir = async () => {
  if (existsSync(nativeDir)) return;
  return fs.mkdir(nativeDir);
};
await mkNativeDir();

const statusType = {
  LOADING: 'LOADING',
  SUCCEED: 'SUCCEED',
  FAILURE: 'FAILURE',
};

const Item = ({ status, message }) => (
  <Text>
    {status === statusType.LOADING && <Spinner />}
    {status === statusType.SUCCEED && <Text color="green">✔</Text>}
    {status === statusType.FAILURE && <Text color="red">✘</Text>}
    <Text> {message}</Text>
  </Text>
);

const Download = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await octokit.rest.repos.getLatestRelease({
        owner: 'mongodb-js',
        repo: 'kerberos',
      });

      setItems(() =>
        Array.from({ length: data.assets.length }).fill({
          status: statusType.LOADING,
          message: '',
        })
      );

      for (const [i, asset] of data.assets.entries()) {
        const filePath = path.resolve(nativeDir, asset.name);
        const unzipDir = path.resolve(
          nativeDir,
          asset.name.replace('.tar.gz', '')
        );

        setItems((prev) =>
          prev.map((item, j) =>
            i !== j
              ? item
              : {
                  ...item,
                  message: `Downloading ${asset.name}`,
                }
          )
        );

        octokit
          .request(asset.browser_download_url)
          .then(({ data }) =>
            fs.appendFile(
              path.resolve(nativeDir, asset.name),
              Buffer.from(data)
            )
          )
          .then(() => {
            setItems((prev) =>
              prev.map((item, j) =>
                i !== j
                  ? item
                  : {
                      ...item,
                      message: `Finish downloading the ${asset.name} file`,
                    }
              )
            );
            return !existsSync(unzipDir) && fs.mkdir(unzipDir);
          })
          .then(
            () =>
              new Promise((resolve, reject) => {
                exec(`tar -zxvf ${filePath} --directory ${unzipDir}`, (err) => {
                  const message = `Unzip the ${asset.name} file`;
                  setItems((prev) =>
                    prev.map((item, j) =>
                      i !== j
                        ? item
                        : {
                            ...item,
                            message: `${message} ${
                              err ? 'failed' : 'successfully'
                            }`,
                          }
                    )
                  );

                  if (err) return reject(err);
                  return resolve();
                });
              })
          )
          .then(() => fs.rm(filePath))
          .then(() => {
            setItems((prev) =>
              prev.map((item, j) =>
                i !== j
                  ? item
                  : {
                      status: statusType.SUCCEED,
                      message: `Saving the ${asset.name} file successfully`,
                    }
              )
            );
          })
          .catch((err) => {
            console.error(err);
            setItems((prev) =>
              prev.map((item, j) =>
                i !== j
                  ? item
                  : {
                      status: statusType.FAILURE,
                      message: `Saving the ${asset.name} file failed`,
                    }
              )
            );
          });
      }
    })();
  }, []);

  return (
    <>
      {items.map((item, i) => (
        <Item key={i} status={item.status} message={item.message} />
      ))}
    </>
  );
};

render(<Download />);
