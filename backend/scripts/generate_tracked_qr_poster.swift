import AppKit
import CoreImage
import Foundation
import Vision

struct TrackedCode {
    let oldPayloadPrefix: String
    let newPayload: String
    let assetName: String
}

let posterPath = "/Users/rowdy/Projects/personal/qemat/qemat_linkedin/Poster.png"
let outputDirectory = URL(fileURLWithPath: "/Users/rowdy/Projects/personal/qemat/qemat_linkedin/qr-assets", isDirectory: true)
let outputPosterPath = "/Users/rowdy/Projects/personal/qemat/qemat_linkedin/Poster-tracked.png"
let codes = [
    TrackedCode(
        oldPayloadPrefix: "https://play.google.com/",
        newPayload: "https://go.qemat.pk/a",
        assetName: "qemat-poster-android.png"
    ),
    TrackedCode(
        oldPayloadPrefix: "https://qemat.pk/",
        newPayload: "https://go.qemat.pk/i",
        assetName: "qemat-poster-ios-web.png"
    ),
]

enum PosterError: Error, CustomStringConvertible {
    case cannotReadImage(String)
    case cannotCreateBitmap
    case missingOriginalCode(String)
    case qrGenerationFailed(String)
    case encodingFailed(String)
    case validationFailed([String])

    var description: String {
        switch self {
        case .cannotReadImage(let path): return "Cannot read image: \(path)"
        case .cannotCreateBitmap: return "Cannot create image bitmap"
        case .missingOriginalCode(let prefix): return "Cannot find original QR code beginning with: \(prefix)"
        case .qrGenerationFailed(let payload): return "Cannot generate QR code for: \(payload)"
        case .encodingFailed(let path): return "Cannot encode PNG: \(path)"
        case .validationFailed(let payloads): return "Final poster QR validation failed; decoded: \(payloads)"
        }
    }
}

func cgImage(from image: NSImage) throws -> CGImage {
    guard
        let tiff = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiff),
        let cgImage = bitmap.cgImage
    else { throw PosterError.cannotCreateBitmap }
    return cgImage
}

func detectCodes(in image: CGImage) throws -> [VNBarcodeObservation] {
    let request = VNDetectBarcodesRequest()
    request.symbologies = [.qr]
    let handler = VNImageRequestHandler(cgImage: image)
    try handler.perform([request])
    return request.results ?? []
}

func makeQrImage(payload: String, moduleScale: Int = 3, quietModules: Int = 4) throws -> NSImage {
    guard let filter = CIFilter(name: "CIQRCodeGenerator") else {
        throw PosterError.qrGenerationFailed(payload)
    }
    filter.setValue(Data(payload.utf8), forKey: "inputMessage")
    filter.setValue("H", forKey: "inputCorrectionLevel")
    guard let output = filter.outputImage else {
        throw PosterError.qrGenerationFailed(payload)
    }

    let context = CIContext(options: [.useSoftwareRenderer: false])
    guard let qrCG = context.createCGImage(output, from: output.extent) else {
        throw PosterError.qrGenerationFailed(payload)
    }
    let modules = Int(output.extent.width)
    let side = CGFloat((modules + quietModules * 2) * moduleScale)
    let qrSide = CGFloat(modules * moduleScale)
    let inset = CGFloat(quietModules * moduleScale)

    let image = NSImage(size: NSSize(width: side, height: side))
    image.lockFocus()
    NSColor.white.setFill()
    NSRect(x: 0, y: 0, width: side, height: side).fill()
    NSGraphicsContext.current?.imageInterpolation = .none
    NSImage(cgImage: qrCG, size: NSSize(width: qrSide, height: qrSide)).draw(
        in: NSRect(x: inset, y: inset, width: qrSide, height: qrSide),
        from: .zero,
        operation: .copy,
        fraction: 1
    )
    image.unlockFocus()
    return image
}

func writePng(_ image: NSImage, to url: URL) throws {
    guard
        let tiff = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiff),
        let png = bitmap.representation(using: .png, properties: [.compressionFactor: 1.0])
    else { throw PosterError.encodingFailed(url.path) }
    try png.write(to: url, options: .atomic)
}

func writePng(_ bitmap: NSBitmapImageRep, to url: URL) throws {
    guard let png = bitmap.representation(using: .png, properties: [.compressionFactor: 1.0]) else {
        throw PosterError.encodingFailed(url.path)
    }
    try png.write(to: url, options: .atomic)
}

do {
    guard
        let sourceData = try? Data(contentsOf: URL(fileURLWithPath: posterPath)),
        let loadedBitmap = NSBitmapImageRep(data: sourceData),
        let sourceCG = loadedBitmap.cgImage
    else {
        throw PosterError.cannotReadImage(posterPath)
    }
    let observations = try detectCodes(in: sourceCG)
    try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

    let width = CGFloat(sourceCG.width)
    let height = CGFloat(sourceCG.height)
    guard let editedBitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: sourceCG.width,
        pixelsHigh: sourceCG.height,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ), let bitmapContext = NSGraphicsContext(bitmapImageRep: editedBitmap) else {
        throw PosterError.cannotCreateBitmap
    }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = bitmapContext
    NSGraphicsContext.current?.imageInterpolation = .none
    NSImage(cgImage: sourceCG, size: NSSize(width: width, height: height)).draw(
        in: NSRect(x: 0, y: 0, width: width, height: height),
        from: .zero,
        operation: .copy,
        fraction: 1
    )

    for code in codes {
        guard let oldObservation = observations.first(where: {
            ($0.payloadStringValue ?? "").hasPrefix(code.oldPayloadPrefix)
        }) else {
            throw PosterError.missingOriginalCode(code.oldPayloadPrefix)
        }
        let qr = try makeQrImage(payload: code.newPayload)
        let qrSize = qr.size.width
        let oldBox = oldObservation.boundingBox
        let centerX = (oldBox.midX * width)
        let centerY = (oldBox.midY * height)
        let tileWidth = oldBox.width * width + 30
        let tileHeight = oldBox.height * height + 24
        let tile = NSRect(
            x: centerX - tileWidth / 2,
            y: centerY - tileHeight / 2,
            width: tileWidth,
            height: tileHeight
        )
        NSColor.white.setFill()
        NSBezierPath(roundedRect: tile, xRadius: 18, yRadius: 18).fill()
        let destination = NSRect(
            x: centerX - qrSize / 2,
            y: centerY - qrSize / 2,
            width: qrSize,
            height: qrSize
        )
        NSGraphicsContext.current?.imageInterpolation = .none
        qr.draw(in: destination, from: .zero, operation: .copy, fraction: 1)
        try writePng(qr, to: outputDirectory.appendingPathComponent(code.assetName))
    }
    NSGraphicsContext.restoreGraphicsState()
    try writePng(editedBitmap, to: URL(fileURLWithPath: outputPosterPath))

    guard let finalImage = NSImage(contentsOfFile: outputPosterPath) else {
        throw PosterError.cannotReadImage(outputPosterPath)
    }
    let decoded = try detectCodes(in: cgImage(from: finalImage)).compactMap(\.payloadStringValue).sorted()
    let expected = codes.map(\.newPayload).sorted()
    guard decoded == expected else {
        throw PosterError.validationFailed(decoded)
    }

    print("Poster: \(outputPosterPath)")
    for code in codes {
        print("QR asset: \(outputDirectory.appendingPathComponent(code.assetName).path)")
    }
    print("Validated payloads: \(decoded.joined(separator: ", "))")
} catch {
    fputs("\(error)\n", stderr)
    exit(1)
}
