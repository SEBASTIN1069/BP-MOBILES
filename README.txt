BP Mobiles Hub — website ippo Firebase (database) use pannudhu.
==================================================================

Ippo phones & accessories ellam script.js-la illa — Firebase-la
irukku, and neenga MATTUM admin.html vazhi add/edit/delete pannalam.
Customers products ellam PAAKKA mattum mudiyum (edit panna mudiyathu),
Flipkart/Amazon maadhiri.

SETUP (ஒரே தடவை மட்டும்):
--------------------------
1. console.firebase.google.com-la account create pannunga, Firestore
   Database, Storage, Authentication (Email/Password) mூnum enable
   pannunga. (Idha Claude step-by-step sonnadhu, adha follow pannunga.)
2. Firebase console-la ungal admin email + password oru user-ah add
   pannunga (Authentication > Users > Add user).
3. Project settings > Your apps-la web app register panni, kudukura
   "firebaseConfig" object-ah "firebase-config.js" file-la paste
   pannunga (adhula already example irukku).
4. "firestore.rules.txt" file-la irukkura rules-ah copy panni Firebase
   console > Firestore Database > Rules tab-la paste pannunga.
5. "storage.rules.txt" file-la irukkura rules-ah copy panni Firebase
   console > Storage > Rules tab-la paste pannunga.
6. Site-ah edhavadhu hosting-la upload pannunga (Hostinger, Netlify,
   Firebase Hosting — edhu venalum). Ellame plain files, backend
   server thevai illa.

DAILY USE:
----------
- Ungal site-oda "/admin.html" ku poi, step 2-la create panna email +
  password vachi login pannunga.
- Adhula phone/accessory add pannalam — brand, model, RAM, storage,
  battery, price, stock, condition, and photos ellam upload
  pannalam. Save pannina odane, site-la ellarukum kaamikkum.
- Edit / Delete buttons table-la irukku, adha vachi manage pannalam.

UPDATE (accounts + accessories fix):
-------------------------------------
- Customer accounts (login/signup) now save to Firestore instead of the
  browser, so "my account disappeared after closing the browser" is
  fixed — accounts persist and work from any device.
- Accessories can now have multiple photos, same as phones.
- The admin tables now update live, so adding one item can never make
  another one vanish from the list.
- If you already published "firestore.rules.txt" before, you MUST
  re-copy the updated version into Firebase console > Firestore
  Database > Rules > Publish, or the new account system won't work.

IMPORTANT:
----------
- admin.html link ellame footer-la "Admin" nu irukku — adha customer
  vera yaravadhu click pannalum, login illama edhuvum pannaladhu.
- Password strong-ah vechikonga, and yarodayum share pannaadheenga.
