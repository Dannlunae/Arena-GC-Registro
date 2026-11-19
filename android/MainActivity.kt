package com.cyber.registro // ← deja la primera línea que genere Android Studio (tu package)

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    // Dirección de tu página en Vercel (ej. https://registro-cyber.vercel.app).
    private val serverUrl = "https://TU-PROYECTO.vercel.app"

    private lateinit var web: WebView
    private var chooser: ValueCallback<Array<Uri>>? = null

    // Selector de archivos (para subir la foto JPG o el PDF del cliente)
    private val picker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
        chooser?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(r.resultCode, r.data))
        chooser = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        setContentView(web)

        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true   // sesión iniciada y caché de Firebase
        web.settings.databaseEnabled = true
        web.webViewClient = WebViewClient()

        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                v: WebView, cb: ValueCallback<Array<Uri>>, p: FileChooserParams
            ): Boolean {
                chooser?.onReceiveValue(null)
                chooser = cb
                return try { picker.launch(p.createIntent()); true }
                catch (e: Exception) { chooser = null; false }
            }
        }

        // WebView no muestra PDF: se abren con el visor o navegador del teléfono.
        web.setDownloadListener { url, _, _, _, _ ->
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (web.canGoBack()) web.goBack() else finish()
            }
        })

        web.loadUrl(serverUrl)
    }
}
